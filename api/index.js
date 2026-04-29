const mongoose = require('mongoose');
const app = require('../backend/server');

if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  const cache = global._mongooseCache;
  const state = mongoose.connection.readyState;

  if (state === 1) return;

  if (state === 0 || state === 3) {
    cache.conn = null;
    cache.promise = null;
  }

  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI env var is missing');

    cache.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 30000,
      })
      .then((m) => {
        cache.conn = m;
        return m;
      })
      .catch((err) => {
        cache.conn = null;
        cache.promise = null;
        throw err;
      });
  }

  await cache.promise;
};

module.exports = async (req, res) => {
  try {
    await connectDB();
    app(req, res);
  } catch (err) {
    console.error('DB connection error:', err.message);
    res.status(500).json({ message: 'DB Error: ' + err.message });
  }
};
