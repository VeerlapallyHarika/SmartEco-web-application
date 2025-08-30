// server.js

// Catch uncaught errors
process.on("uncaughtException", err => {
  console.error("❌ Uncaught Exception:", err);
});
process.on("unhandledRejection", err => {
  console.error("❌ Unhandled Rejection:", err);
});

console.log("🚀 Starting server.js...");

// Load environment variables
require("dotenv").config();
console.log("✅ .env loaded");

const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

const limiter = rateLimit({ windowMs: 60_000, max: 100 });
app.use(limiter);

// Connect to MongoDB
console.log("📡 Connecting to MongoDB...");
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo error", err));

// Load routes
console.log("📌 Loading routes...");
try {
  app.use("/api/auth", require("../routes/auth"));
  app.use("/api/classify", require("../routes/classify"));
  app.use("/api/logs", require("../routes/logs"));
  app.use("/api/rewards", require("../routes/rewards"));
  app.use("/api/centers", require("../routes/centers"));
  console.log("✅ Routes loaded");
} catch (err) {
  console.error("❌ Route loading error:", err);
}

// Start server
const PORT = process.env.PORT || 5000;
console.log("✅ Reached before app.listen()");
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch(err => console.error("❌ Mongo error", err));

// app.use("/api/auth", require("./routes/auth"));
// app.use("/api/classify", require("./routes/classify"));
// app.use("/api/logs", require("./routes/logs"));
// app.use("/api/rewards", require("./routes/rewards"));
// app.use("/api/centers", require("./routes/centers"));

app.get("/", (req, res) => {
  res.send("Server is running...");
});
