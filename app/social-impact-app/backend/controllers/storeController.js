const Store = require('../models/Store');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Redemption = require('../models/Redemption');

// @desc Get all store items
const getStoreItems = async (req, res) => {
  try {
    const { category } = req.query;
    let query = { isActive: true };
    if (category) query.category = category;

    const items = await Store.find(query);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get store item by id
const getStoreItemById = async (req, res) => {
  try {
    const item = await Store.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Redeem store item
const redeemItem = async (req, res) => {
  try {
    const item = await Store.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (!item.isActive) return res.status(400).json({ message: 'Item not available' });

    const user = await User.findOneAndUpdate(
      { _id: req.user._id, coinBalance: { $gte: item.coinCost } },
      { $inc: { coinBalance: -item.coinCost } },
      { new: true }
    );
    if (!user) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Reduce stock
    if (item.stock !== -1) {
      item.stock -= 1;
      if (item.stock === 0) item.isActive = false;
      await item.save();
    }

    // Create transaction
    await Transaction.create({
      userId: user._id,
      type: 'spent',
      amount: item.coinCost,
      source: 'store_redemption',
      referenceId: item._id,
    });

    // Generate coupon code
    const couponCode = 'SI-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create Redemption record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    await Redemption.create({
      userId: user._id,
      itemId: item._id,
      couponCode,
      expiresAt
    });

    res.json({
      message: 'Item redeemed successfully!',
      couponCode,
      remainingCoins: user.coinBalance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get my redemptions
const getMyRedemptions = async (req, res) => {
  try {
    const redemptions = await Transaction.find({
      userId: req.user._id,
      source: 'store_redemption'
    }).sort({ createdAt: -1 });
    res.json(redemptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create store item (Admin)
const createStoreItem = async (req, res) => {
  try {
    const item = await Store.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update store item (Admin)
const updateStoreItem = async (req, res) => {
  try {
    const item = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete store item (Admin)
const deleteStoreItem = async (req, res) => {
  try {
    const item = await Store.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStoreItems, getStoreItemById, redeemItem, getMyRedemptions, createStoreItem, updateStoreItem, deleteStoreItem };