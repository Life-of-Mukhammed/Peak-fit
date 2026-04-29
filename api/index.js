const mongoose = require('mongoose');
const app = require('../backend/server');

// Cache connection across warm invocations
let connected = false;

const connectDB = async () => {
  if (connected || mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    bufferCommands: false,
  });
  connected = true;
};

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
