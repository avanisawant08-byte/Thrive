const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require("./routes/auth");
const googleAuthRoutes = require("./routes/googleAuth");
const eventRoutes = require("./routes/events");
const activityRoutes = require("./routes/activities");
const rewardRoutes = require("./routes/rewards");
const storeRoutes = require("./routes/store");

// Initialize express app
const app = express();

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:3000",  // React dev server
    "http://localhost:5173",  // Vite dev server
    "http://localhost:8080",  // Alternative port
  ],
  credentials: true,
}));

app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ─────────────────────────────────────────────
// Database Connection
// ─────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully!");
    console.log("   Database:", mongoose.connection.name);
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1); // Exit if database connection fails
  });

// ─────────────────────────────────────────────
// Firebase Initialization
// ─────────────────────────────────────────────
try {
  require("./config/firebase"); // Initialize Firebase on startup
  console.log("✅ Firebase Initialized Successfully!");
} catch (err) {
  console.error("❌ Firebase Initialization Failed:", err.message);
}

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.use("/v1/auth", authRoutes);           // POST /v1/auth/register, /login, etc.
app.use("/v1/auth", googleAuthRoutes);     // POST /v1/auth/google-login
app.use("/v1/events", eventRoutes);        // GET/POST /v1/events
app.use("/v1/activities", activityRoutes); // GET/POST /v1/activities
app.use("/v1/rewards", rewardRoutes);      // GET /v1/rewards/balance, /leaderboard
app.use("/v1/store", storeRoutes);         // GET/POST /v1/store

// ─────────────────────────────────────────────
// Health Check Route
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "🌱 Social Impact App API is running!",
    version: "1.0",
    status: "healthy",
    endpoints: {
      auth: "/v1/auth",
      events: "/v1/events",
      activities: "/v1/activities",
      rewards: "/v1/rewards",
      store: "/v1/store",
    },
  });
});

// ─────────────────────────────────────────────
// 404 Handler — Route not found
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ message: "Internal server error. Please try again." });
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/v1\n`);
});
