const mongoose = require('mongoose');
const app = require('../backend/server');

// Cache connection promise on the global object so it survives module re-evaluation
// between warm Vercel invocations without losing the in-flight promise.
if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  const cache = global._mongooseCache;
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 8000,
      })
      .then((m) => {
        cache.conn = m;
        return m;
      })
      .catch((err) => {
        cache.promise = null; // allow retry on next request
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
