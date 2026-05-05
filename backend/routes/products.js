const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const auth = require('../middleware/clubAuth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `product_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = { club: req.user.club };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
      ];
    }
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, club: req.user.club });
    if (!product) return res.status(404).json({ message: 'Mahsulot topilmadi' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}');
    const product = new Product({
      ...data,
      club: req.user.club,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}');
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    delete data.club;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, club: req.user.club },
      data,
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Mahsulot topilmadi' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Product.findOneAndDelete({ _id: req.params.id, club: req.user.club });
    if (!result) return res.status(404).json({ message: 'Mahsulot topilmadi' });
    res.json({ message: 'Mahsulot o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
