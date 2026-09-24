const express = require('express');
const router = express.Router();
const { 
  verifyCoupon, 
  redeemCoupon, 
  getShopkeeperHistory, 
  updateShopProfile,
  createShopCoupon,
  adminGetAllShopkeepers,
  adminCreateShopkeeper,
  adminDeleteShopkeeper
} = require('../controllers/shopkeeperController');
const { protect, adminOnly, shopkeeperOnly } = require('../middleware/authMiddleware');

router.use(protect);

// Shopkeeper & Admin shared routes
router.get('/verify/:code', shopkeeperOnly, verifyCoupon);
router.post('/redeem', shopkeeperOnly, redeemCoupon);
router.get('/history', shopkeeperOnly, getShopkeeperHistory);
router.put('/profile', shopkeeperOnly, updateShopProfile);
router.post('/coupons', shopkeeperOnly, createShopCoupon);

// Admin only routes
router.get('/admin/all', adminOnly, adminGetAllShopkeepers);
router.post('/admin/create', adminOnly, adminCreateShopkeeper);
router.delete('/admin/:id', adminOnly, adminDeleteShopkeeper);

module.exports = router;
