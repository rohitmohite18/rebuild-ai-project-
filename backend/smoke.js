const { spawn } = require('child_process');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

const PORT = 5055;
const BASE = `http://127.0.0.1:${PORT}`;

async function request(method, url, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${url} -> ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

function waitForOutput(child, pattern, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server start timed out')), timeoutMs);
    let buf = '';
    const onData = (chunk) => {
      buf += chunk.toString();
      if (pattern.test(buf)) {
        clearTimeout(timer);
        child.stdout.off('data', onData);
        child.stderr.off('data', onData);
        resolve();
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Server exited early (${code}): ${buf}`));
    });
  });
}

(async () => {
  const mongo = await MongoMemoryServer.create();
  const child = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGO_URI: mongo.getUri(),
      JWT_SECRET: 'smoke-test-secret',
      JWT_EXPIRES_IN: '1h',
    },
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let passed = false;
  try {
    await waitForOutput(child, /Server running/);

    const health = await request('GET', '/api/health');
    if (!health.ok) throw new Error('health failed');

    const registered = await request('POST', '/api/auth/register', {
      body: {
        name: 'Admin User',
        email: 'admin@rebuild.test',
        password: 'secret12',
        role: 'admin',
      },
    });
    const token = registered.token;
    if (!token || registered.user.password) throw new Error('register leaked password or missing token');

    const me = await request('GET', '/api/auth/me', { token });
    if (me.user.email !== 'admin@rebuild.test') throw new Error('me mismatch');

    const login = await request('POST', '/api/auth/login', {
      body: { email: 'admin@rebuild.test', password: 'secret12' },
    });
    if (!login.token) throw new Error('login failed');

    const familyRes = await request('POST', '/api/families', {
      token,
      body: { familyName: 'Patel', location: { city: 'Mumbai' }, members: [{ name: 'Asha', status: 'safe' }] },
    });
    const familyId = familyRes.family._id;
    if (!/^RB-\d{4}-\d{5}$/.test(familyRes.family.recoveryId)) {
      throw new Error(`bad recovery id: ${familyRes.family.recoveryId}`);
    }

    await request('GET', `/api/families/${familyId}`, { token });
    await request('PUT', `/api/families/${familyId}`, {
      token,
      body: { status: 'sheltered' },
    });

    const helpRes = await request('POST', '/api/help', {
      token,
      body: { family: familyId, category: 'food', description: 'Need meals for 4' },
    });
    await request('GET', '/api/help', { token });
    await request('PUT', `/api/help/${helpRes.help._id}`, {
      token,
      body: { status: 'assigned' },
    });

    const shelterRes = await request('POST', '/api/shelters', {
      token,
      body: { name: 'North Hall', address: '1 Main St', capacity: 100, occupied: 12 },
    });
    await request('GET', '/api/shelters', { token });
    await request('PUT', `/api/shelters/${shelterRes.shelter._id}`, {
      token,
      body: { occupied: 15 },
    });

    const dashboard = await request('GET', '/api/admin/dashboard', { token });
    if (dashboard.dashboard.families < 1) throw new Error('dashboard empty');

    passed = true;
    console.log('SMOKE_OK', {
      recoveryId: familyRes.family.recoveryId,
      dashboard: dashboard.dashboard,
    });
  } finally {
    child.kill('SIGTERM');
    await mongo.stop();
  }

  if (!passed) process.exit(1);
})().catch((err) => {
  console.error('SMOKE_FAIL', err);
  process.exit(1);
});
