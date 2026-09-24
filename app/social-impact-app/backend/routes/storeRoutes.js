const express = require('express');
const router = express.Router();
const {
  getStoreItems, getStoreItemById, redeemItem,
  getMyRedemptions, createStoreItem,
  updateStoreItem, deleteStoreItem
} = require('../controllers/storeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getStoreItems);
router.get('/redemptions/me', protect, getMyRedemptions);
router.get('/:id', getStoreItemById);
router.post('/:id/redeem', protect, redeemItem);
router.post('/', protect, adminOnly, createStoreItem);
router.put('/:id', protect, adminOnly, updateStoreItem);
router.delete('/:id', protect, adminOnly, deleteStoreItem);

module.exports = router;
