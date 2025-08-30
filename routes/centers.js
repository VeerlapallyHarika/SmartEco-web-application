const express = require('express');
const router = express.Router();
const RecyclingCenter = require('../../models/RecyclingCenter');

router.get('/nearby', async (req, res) => {
  const lat = parseFloat(req.query.lat), lng = parseFloat(req.query.lng);
  const radius = parseInt(req.query.radius) || 5000;
  if (!lat || !lng) return res.status(400).json({ error: 'lat+lng required' });

  const centers = await RecyclingCenter.find({
    coords: {
      $near: {
        $geometry: { type: "Point", coordinates: [ lng, lat ] },
        $maxDistance: radius
      }
    }
  }).limit(50);

  res.json({ centers });
});

module.exports = router;
