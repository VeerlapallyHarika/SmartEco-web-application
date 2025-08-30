require('dotenv').config();
const mongoose = require('mongoose');
const RecyclingCenter = require('../models/RecyclingCenter');
const Reward = require('../models/Reward');

async function seed(){
  await mongoose.connect(process.env.MONGO_URI);
  await RecyclingCenter.deleteMany({});
  await Reward.deleteMany({});

  const centers = [
    { name: 'Green Center A', address: 'City A', coords: { type:'Point', coordinates: [78.4867, 17.3850] }, contact: '9999999999', accepts: ['plastic','paper','glass'] },
    { name: 'Green Center B', address: 'City B', coords: { type:'Point', coordinates: [77.5946, 12.9716] }, contact: '8888888888', accepts: ['organic','plastic'] },
    { name: 'Hazardous Drop', address: 'City C', coords: { type:'Point', coordinates: [72.8777, 19.0760] }, contact: '7777777777', accepts: ['hazardous'] }
  ];
  await RecyclingCenter.insertMany(centers);

  const rewards = [
    { title: '5% Shop Coupon', description: 'Use at partner store', costPoints: 100, type: 'coupon' },
    { title: 'Eco Warrior Badge', description: 'Awarded for 100 points', costPoints: 0, type: 'badge' }
  ];
  await Reward.insertMany(rewards);

  console.log('Seeding completed');
  process.exit(0);
}
seed();
