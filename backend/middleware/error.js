function errorHandler(err, _req, res, _next) {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `${field} already exists` });
  }

  const status = err.statusCode || 500;
  const message = status === 500 ? 'Server error' : err.message;
  if (status === 500) {
    console.error(err);
  }
  return res.status(status).json({ message });
}

function notFound(_req, res) {
  res.status(404).json({ message: 'Route not found' });
}

module.exports = { errorHandler, notFound };
