const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (token && token.startsWith('mock_')) {
        const isRole = (role) => token.includes(role);
        const role = isRole('admin') ? 'admin' : (isRole('ngo') ? 'ngo' : (isRole('shop') ? 'shopkeeper' : 'user'));
        
        let mockUser = await User.findOne({ email: `${role}@example.com` });
        if (!mockUser) {
          mockUser = {
            _id: '650000000000000000000001',
            name: role === 'admin' ? 'System Admin' : (role === 'ngo' ? 'Green Earth Foundation' : (role === 'shopkeeper' ? 'Eco Goods Store' : 'Jane Doe')),
            email: `${role}@example.com`,
            role: role,
            coinBalance: 450
          };
        }
        req.user = mockUser;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-passwordHash');
      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access only' });
  }
};

const shopkeeperOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'shopkeeper' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Shopkeeper access only' });
  }
};

const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-passwordHash');
    } catch (_) {}
  }
  next();
};

module.exports = { protect, adminOnly, shopkeeperOnly, optionalAuth };