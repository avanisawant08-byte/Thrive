const Redemption = require('../models/Redemption');
const User = require('../models/User');
const Store = require('../models/Store');
const bcrypt = require('bcryptjs');

// @desc Verify coupon code
// @route GET /api/shopkeeper/verify/:code
const verifyCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const redemption = await Redemption.findOne({ couponCode: code.toUpperCase() })
      .populate('userId', 'name email')
      .populate('itemId', 'title coinCost');

    if (!redemption) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    if (redemption.status === 'redeemed') {
      return res.json({ 
        message: 'Already Used', 
        redemption 
      });
    }

    if (new Date() > redemption.expiresAt) {
      redemption.status = 'expired';
      await redemption.save();
      return res.status(400).json({ message: 'Coupon expired' });
    }

    res.json({
      message: 'Coupon Claimed',
      redemption
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Mark coupon as redeemed
// @route POST /api/shopkeeper/redeem
const redeemCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const redemption = await Redemption.findOne({ couponCode: code.toUpperCase() });

    if (!redemption) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    if (redemption.status === 'redeemed') {
      return res.status(400).json({ message: 'Coupon already redeemed' });
    }

    if (redemption.status === 'expired' || new Date() > redemption.expiresAt) {
      return res.status(400).json({ message: 'Coupon expired' });
    }

    redemption.status = 'redeemed';
    redemption.shopkeeperId = req.user._id;
    redemption.redeemedAt = new Date();
    await redemption.save();

    res.json({
      message: 'Coupon redeemed successfully!',
      redemption
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get redemption history for shopkeeper
// @route GET /api/shopkeeper/history
const getShopkeeperHistory = async (req, res) => {
  try {
    const history = await Redemption.find({ 
      shopkeeperId: req.user._id,
      status: 'redeemed'
    })
    .populate('userId', 'name email')
    .populate('itemId', 'title coinCost') // Added coinCost
    .sort({ redeemedAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update shop profile
// @route PUT /api/shopkeeper/profile
const updateShopProfile = async (req, res) => {
  try {
    const { shopName, category, address, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.shopDetails) user.shopDetails = {};
    
    if (shopName) user.shopDetails.shopName = shopName;
    if (category) user.shopDetails.category = category;
    if (address) user.shopDetails.address = address;
    if (phone) user.shopDetails.phone = phone;

    await user.save();
    res.json({ message: 'Shop profile updated', shopDetails: user.shopDetails });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create a new coupon (Store Item) as a shopkeeper
// @route POST /api/shopkeeper/coupons
const createShopCoupon = async (req, res) => {
  try {
    const { title, description, coinCost } = req.body;
    
    if (!title || !description || coinCost === undefined) {
      return res.status(400).json({ message: 'Title, description, and coin cost are required' });
    }

    const numericCost = Number(coinCost);
    if (!Number.isInteger(numericCost) || numericCost <= 0 || numericCost > 100000) {
      return res.status(400).json({ message: 'Coin cost must be a positive integer up to 100,000' });
    }

    const newItem = await Store.create({
      title: String(title).slice(0, 100),
      description: String(description).slice(0, 500),
      coinCost: numericCost,
      category: 'coupon',
      vendorId: req.user._id,
      isActive: true
    });

    res.status(201).json({
      message: 'Coupon created successfully!',
      item: newItem
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all shopkeepers (Admin only)
// @route GET /api/shopkeeper/admin/all
const adminGetAllShopkeepers = async (req, res) => {
  try {
    const shopkeepers = await User.find({ role: 'shopkeeper' }).select('-passwordHash');
    res.json(shopkeepers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create shopkeeper account (Admin only)
// @route POST /api/shopkeeper/admin/create
const adminCreateShopkeeper = async (req, res) => {
  try {
    const { name, email, password, shopName } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'shopkeeper',
      shopDetails: {
        shopName,
        category: 'other'
      }
    });

    res.status(201).json({
      message: 'Shopkeeper account created successfully',
      user: { _id: user._id, name, email, role: 'shopkeeper' }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete shopkeeper account (Admin only)
// @route DELETE /api/shopkeeper/admin/:id
const adminDeleteShopkeeper = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'shopkeeper') {
      return res.status(404).json({ message: 'Shopkeeper not found' });
    }
    await user.deleteOne();
    res.json({ message: 'Shopkeeper account deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  verifyCoupon,
  redeemCoupon,
  getShopkeeperHistory,
  updateShopProfile,
  createShopCoupon,
  adminGetAllShopkeepers,
  adminCreateShopkeeper,
  adminDeleteShopkeeper
};
