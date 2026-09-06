const Family = require('../../database/models/Family');

async function generateRecoveryId() {
  const year = new Date().getFullYear();
  const prefix = `RB-${year}-`;
  const last = await Family.findOne({ recoveryId: new RegExp(`^${prefix}`) })
    .sort({ recoveryId: -1 })
    .select('recoveryId')
    .lean();

  let next = 1;
  if (last?.recoveryId) {
    next = Number.parseInt(last.recoveryId.slice(-5), 10) + 1;
  }

  return `${prefix}${String(next).padStart(5, '0')}`;
}

module.exports = { generateRecoveryId };
