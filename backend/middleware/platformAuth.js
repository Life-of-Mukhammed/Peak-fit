const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token topilmadi' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (decoded.role !== 'platformAdmin') {
      const u = await User.findById(decoded.id).select('role');
      if (!u || u.role !== 'platformAdmin') {
        return res.status(403).json({ message: 'Faqat FitOS platforma admini uchun' });
      }
    }
    next();
  } catch {
    res.status(401).json({ message: 'Token yaroqsiz' });
  }
};
