require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../database/connection');
const { errorHandler, notFound } = require('./middleware/error');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/families', require('./routes/families'));
app.use('/api/help', require('./routes/help'));
app.use('/api/shelters', require('./routes/shelters'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

app.use(notFound);
app.use(errorHandler);

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set');
  process.exit(1);
}

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
