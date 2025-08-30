const express = require('express');
const router = express.Router();
const auth = require('../auth');
const multer = require('multer');
const upload = multer();
const axios = require('axios');
const WasteLog = require('../../models/WasteLog');
const User = require('../../models/user');

const CONF_THRESHOLD = 0.6;
const BASE_POINTS = { plastic: 10, paper: 5, glass: 8, organic: 2, hazardous: 20 };

function calcPoints(category, weightKg = 0.1){
  const base = BASE_POINTS[category] || 1;
  return Math.round(base * (weightKg || 0.1) * 10) / 10;
}

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    let payload;
    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      payload = { imageBase64: b64 };
    } else if (req.body.imageUrl) {
      payload = { imageUrl: req.body.imageUrl };
    } else {
      return res.status(400).json({ error: 'image required' });
    }

    const mlRes = await axios.post(process.env.ML_API_URL, payload, { timeout: 15000 });
    const { category, confidence, subcategory } = mlRes.data;

    if (confidence < CONF_THRESHOLD) return res.json({ manualRequired: true, confidence });

    const weightKg = parseFloat(req.body.weightKg) || 0.1;
    const points = calcPoints(category, weightKg);

    const log = await WasteLog.create({
      user: req.userId,
      category, subcategory, weightKg, points,
      imageUrl: req.body.imageUrl || null,
      confidence, manual: false
    });

    await User.findByIdAndUpdate(req.userId, { $inc: { points } });

    res.json({ ok: true, category, confidence, points, logId: log._id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'classification failed', details: e.message });
  }
});

module.exports = router;
