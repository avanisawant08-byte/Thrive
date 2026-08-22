const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');

// 1. Bypass ISP DNS blocking for MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

// 2. Ensure compatibility with Node 18+ and Node 24 strict IPv6 resolution
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const activityRoutes = require('./routes/activityRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const storeRoutes = require('./routes/storeRoutes');
const shopkeeperRoutes = require('./routes/shopkeeperRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const adminRoutes = require('./routes/adminRoutes');
const socialRoutes = require('./routes/socialRoutes');
const donationRoutes = require('./routes/donationRoutes');
const statsRoutes = require('./routes/statsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/v1/auth', authRoutes);
app.use('/v1/events', eventRoutes);
app.use('/v1/activities', activityRoutes);
app.use('/v1/rewards', rewardRoutes);
app.use('/v1/store', storeRoutes);
app.use('/v1/shopkeeper', shopkeeperRoutes);
app.use('/v1/ngo', ngoRoutes);
app.use('/v1/admin', adminRoutes);
app.use('/v1/social', socialRoutes);
app.use('/v1/donations', donationRoutes);
app.use('/v1/stats', statsRoutes);
app.use('/v1/notifications', notificationRoutes);

// Error Middleware
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Social Impact API Running!' });
});

// 404 & Error Handler
app.use(notFound);
app.use(errorHandler);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  family: 4,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });