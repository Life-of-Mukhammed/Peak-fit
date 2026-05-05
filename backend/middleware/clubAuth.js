const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token topilmadi' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.club) {
      return res.status(403).json({ message: 'Bu modul faqat klub foydalanuvchilari uchun' });
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token yaroqsiz' });
  }
};
