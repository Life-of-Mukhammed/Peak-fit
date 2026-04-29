const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/tariffs', require('./routes/tariffs'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/branches', require('./routes/branches'));
app.use('/api/services', require('./routes/services'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/smena', require('./routes/smena'));
app.use('/api/admin', require('./routes/admin'));

mongoose.set('bufferCommands', false);

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('MongoDB connection error:', err));
}

module.exports = app;
