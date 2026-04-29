const mongoose = require('mongoose');
const app = require('../backend/server');

if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  const cache = global._mongooseCache;
  const state = mongoose.connection.readyState;

  if (state === 1) return; // connected

  // Connection dropped — clear the stale resolved promise so we reconnect
  if (state === 0 || state === 3) {
    cache.conn = null;
    cache.promise = null;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
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
    console.error('DB connection error:', err);
    res.status(500).json({ message: 'Database connection failed: ' + err.message });
  }
};
