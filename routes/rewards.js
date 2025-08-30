const express = require('express');
const router = express.Router();
const auth = require('../backend/auth');
const Reward = require('../models/Reward');
const User = require('../models/user');

router.get('/', async (req, res) => {
  const rewards = await Reward.find({ active: true });
  res.json({ rewards });
});

router.post('/redeem', auth, async (req, res) => {
  const { rewardId } = req.body;
  const reward = await Reward.findById(rewardId);
  if (!reward) return res.status(404).json({ error: 'Not found' });
  const user = await User.findById(req.userId);
  if (user.points < reward.costPoints) return res.status(400).json({ error: 'Not enough points' });
  user.points -= reward.costPoints;
  user.badges.push(reward.title);
  await user.save();
  res.json({ ok: true, points: user.points, badge: reward.title });
});

module.exports = router;
