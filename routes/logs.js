const express = require('express');
const router = express.Router();
const auth = require('../auth');
const WasteLog = require('../../models/WasteLog');
const User = require('../../models/user');

router.get('/', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const per = 20;
  const logs = await WasteLog.find({ user: req.userId }).sort({ createdAt: -1 }).skip((page-1)*per).limit(per);
  res.json({ logs });
});

router.post('/', auth, async (req, res) => {
  const { category, subcategory, weightKg = 0.1, imageUrl, confidence = 1, manual = true } = req.body;
  const points = Math.round(((category === 'plastic' ? 10 : 1) * weightKg) * 10) / 10;
  const log = await WasteLog.create({ user: req.userId, category, subcategory, weightKg, points, imageUrl, confidence, manual });
  await User.findByIdAndUpdate(req.userId, { $inc: { points } });
  res.json({ ok: true, log });
});

module.exports = router;
