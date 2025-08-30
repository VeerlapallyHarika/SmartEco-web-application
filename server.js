/**
 * Smart Waste Segregation & Recycling System - Backend (Node.js)
 * --------------------------------------------------------------
 * Features:
 * - /api/classify         : classifies waste (simple keyword + image-mimetype stub)
 * - /api/centers          : fetch nearby recycling centers by category
 * - /api/logItem          : logs a recycled item, updates points & stats
 * - /api/user             : fetch user profile (points, badges, streak)
 * - /api/leaderboard      : simple community leaderboard
 * - /api/stats            : per-user analytics summary
 *
 * Storage: In-memory for demo. Swap with MongoDB/MySQL/Firebase in production.
 */

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const path = require("path");

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Demo "database" (in-memory) ---
const USERS = new Map(); // key=userId -> {id,name,points,badges,streak,lastLogISO,history:[...]}
const COMMUNITY = [];    // array of {userId,name,points}
const ITEMS = [];        // audit log
const RECYCLING_CENTERS = [
  // Sample India-centric data; replace with real DB or Google Places API
  {
    id: "ctr-1",
    name: "GreenCycle E-Waste Center",
    category: "hazardous",
    address: "Madhapur, Hyderabad",
    phone: "+91-40-1234-5678",
    hours: "Mon–Sat 9:00–18:00",
    lat: 17.4483,
    lng: 78.3915
  },
  {
    id: "ctr-2",
    name: "EcoBin Plastic & Metal",
    category: "recyclable",
    address: "HITEC City, Hyderabad",
    phone: "+91-40-9876-5432",
    hours: "Daily 8:00–20:00",
    lat: 17.4435,
    lng: 78.3772
  },
  {
    id: "ctr-3",
    name: "BioCompost Drop-off",
    category: "biodegradable",
    address: "Jubilee Hills, Hyderabad",
    phone: "+91-40-1111-2222",
    hours: "Mon–Fri 7:00–17:00",
    lat: 17.4320,
    lng: 78.4070
  }
];

// --- Helpers ---
function getOrCreateUser(name = "Guest") {
  // For demo: single user persisted in-memory per server run
  let user = [...USERS.values()].find(u => u.name === name);
  if (!user) {
    const id = uuid();
    user = {
      id, name,
      points: 0,
      badges: [],
      streak: 0,
      lastLogISO: null,
      history: [] // {ts, itemName, category, points}
    };
    USERS.set(id, user);
    COMMUNITY.push({ userId: id, name, points: 0 });
  }
  return user;
}

function awardBadges(user) {
  const newBadges = [];
  if (user.points >= 50 && !user.badges.includes("Recycler Novice")) newBadges.push("Recycler Novice");
  if (user.points >= 200 && !user.badges.includes("Eco Warrior")) newBadges.push("Eco Warrior");
  if (user.points >= 500 && !user.badges.includes("Planet Guardian")) newBadges.push("Planet Guardian");
  user.badges.push(...newBadges);
  return newBadges;
}

function updateStreak(user, tsISO) {
  const today = new Date(tsISO);
  const last = user.lastLogISO ? new Date(user.lastLogISO) : null;
  if (!last) { user.streak = 1; return; }
  const diffDays = Math.floor((today - new Date(last.toDateString())) / (24 * 3600 * 1000));
  if (diffDays === 1) user.streak += 1;
  else if (diffDays > 1) user.streak = 1;
}

// Simple rule-based classifier (replace with TensorFlow/ONNX in production)
function classifyHeuristic(text = "", file) {
  const t = (text || "").toLowerCase();

  // Image mime can hint: (purely demo)
  if (file && file.mimetype && file.mimetype.includes("image")) {
    // Try guessing from filename
    const fname = (file.originalname || "").toLowerCase();
    if (/(banana|apple|veg|leaf|food|peel|bread)/.test(fname)) return "biodegradable";
    if (/(battery|cell|acid|paint|chemical|e-waste|ewaste)/.test(fname)) return "hazardous";
    if (/(bottle|plastic|pet|can|tin|metal|glass|paper|carton)/.test(fname)) return "recyclable";
  }

  if (/(banana|veg|food|peel|garden|leaves|compost)/.test(t)) return "biodegradable";
  if (/(battery|cell|acid|paint|chemical|mercury|e-waste|ewaste)/.test(t)) return "hazardous";
  if (/(plastic|pet|bottle|glass|metal|aluminium|tin|paper|cardboard|carton)/.test(t)) return "recyclable";
  return "unknown";
}

function pointsFor(category) {
  switch (category) {
    case "recyclable": return 5;       // e.g., plastic bottle
    case "biodegradable": return 3;    // e.g., food/greens
    case "hazardous": return 10;       // batteries/chemicals handled right
    default: return 1;
  }
}

// --- API Routes ---

// Static hosting for frontend (optional; put index.html in ./public)
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_, res) => res.json({ ok: true }));

// Create or fetch a demo user
app.post("/api/user/init", (req, res) => {
  const { name } = req.body || {};
  const user = getOrCreateUser(name || "Guest");
  res.json({ user });
});

// Classify by text and/or image
app.post("/api/classify", upload.single("image"), (req, res) => {
  const { description = "" } = req.body || {};
  const file = req.file || null;

  const category = classifyHeuristic(description, file);
  const guidance = {
    biodegradable: "Put in green bin. Compost if possible. Avoid plastic liners.",
    recyclable: "Rinse and put in blue bin. Check local rules for caps/labels.",
    hazardous: "Do not put in household bins. Drop at hazardous/e-waste center.",
    unknown: "Not sure? Check local municipality guidelines."
  }[category] || "Not sure? Check local municipality guidelines.";

  // Demo subcategory
  let sub = null;
  if (category === "recyclable") {
    if (/(glass)/.test((description || "").toLowerCase())) sub = "glass";
    else if (/(paper|cardboard|carton)/.test((description || "").toLowerCase())) sub = "paper";
    else if (/(metal|can|tin|aluminium)/.test((description || "").toLowerCase())) sub = "metal";
    else sub = "plastic";
  }

  res.json({ category, subcategory: sub, guidance });
});

// Get nearby centers by category (no geolocation in demo; returns all matching)
app.get("/api/centers", (req, res) => {
  const { category } = req.query;
  const list = category ? RECYCLING_CENTERS.filter(c => c.category === category) : RECYCLING_CENTERS;
  res.json({ centers: list });
});

// Log an item -> award points, update streak, badges
app.post("/api/logItem", (req, res) => {
  const { name = "Guest", itemName = "Item", category = "unknown" } = req.body || {};
  const user = getOrCreateUser(name);
  const ts = new Date().toISOString();
  const pts = pointsFor(category);

  user.points += pts;
  user.history.push({ ts, itemName, category, points: pts });
  updateStreak(user, ts);
  user.lastLogISO = ts;
  const newBadges = awardBadges(user);

  // Update community mirror
  const entry = COMMUNITY.find(c => c.userId === user.id);
  if (entry) entry.points = user.points;

  // Simple CO2/tree estimates (very rough demo multipliers)
  const stats = {
    plasticReducedKg: user.history.filter(h => h.category === "recyclable").length * 0.05,
    co2SavedKg: Math.round(user.points * 0.12 * 100) / 100,
    treesSaved: Math.round((user.points / 100) * 10) / 10
  };

  // Audit
  ITEMS.push({ id: uuid(), userId: user.id, itemName, category, ts, pts });

  res.json({
    ok: true,
    user: { id: user.id, name: user.name, points: user.points, badges: user.badges, streak: user.streak },
    earned: { points: pts, newBadges },
    stats
  });
});

// Fetch user snapshot
app.get("/api/user", (req, res) => {
  const { name = "Guest" } = req.query;
  const user = getOrCreateUser(name);
  res.json({ user });
});

// Leaderboard (top 10)
app.get("/api/leaderboard", (req, res) => {
  const top = COMMUNITY.slice().sort((a, b) => b.points - a.points).slice(0, 10);
  res.json({ top });
});

// Analytics (simple aggregation)
app.get("/api/stats", (req, res) => {
  const { name = "Guest" } = req.query;
  const user = getOrCreateUser(name);
  const byCategory = { biodegradable: 0, recyclable: 0, hazardous: 0, unknown: 0 };
  user.history.forEach(h => { byCategory[h.category] = (byCategory[h.category] || 0) + 1; });

  const plasticReducedKg = user.history.filter(h => h.category === "recyclable").length * 0.05;
  const co2SavedKg = Math.round(user.points * 0.12 * 100) / 100;
  const treesSaved = Math.round((user.points / 100) * 10) / 10;

  res.json({
    summary: { points: user.points, streak: user.streak, badges: user.badges },
    byCategory,
    impact: { plasticReducedKg, co2SavedKg, treesSaved },
    history: user.history.slice(-25) // last 25
  });
});

// --- Start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
