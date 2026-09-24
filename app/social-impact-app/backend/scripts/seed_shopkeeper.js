const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./backend/models/User');

dotenv.config({ path: './backend/.env' });

async function createShopkeeper() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'shop@example.com';
    const password = 'password123';
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Shopkeeper already exists. Updating role...');
      existingUser.role = 'shopkeeper';
      existingUser.shopDetails = {
        shopName: 'Green Cup Cafe',
        category: 'cafe',
        address: '123 Sustainability Lane, Eco City',
        phone: '555-0199'
      };
      await existingUser.save();
      console.log('Shopkeeper updated successfully!');
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        name: 'Shop Owner',
        email,
        passwordHash,
        role: 'shopkeeper',
        shopDetails: {
          shopName: 'Green Cup Cafe',
          category: 'cafe',
          address: '123 Sustainability Lane, Eco City',
          phone: '555-0199'
        }
      });
      console.log('Shopkeeper created successfully!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createShopkeeper();
