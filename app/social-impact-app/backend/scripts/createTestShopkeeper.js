const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env from one level up
dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'ngo', 'shopkeeper', 'admin'], default: 'user' },
  shopDetails: {
    shopName: String,
    category: String,
    address: String,
    phone: String,
    logo: String
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

async function createShopkeeper() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'shop@test.com';
    const password = 'password123';
    
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Shopkeeper already exists. Updating role...');
      existing.role = 'shopkeeper';
      if (!existing.shopDetails) {
        existing.shopDetails = { shopName: 'Eco Test Store', category: 'retail' };
      }
      await existing.save();
      console.log('User updated to shopkeeper.');
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        name: 'Test Shopkeeper',
        email: email,
        passwordHash: passwordHash,
        role: 'shopkeeper',
        shopDetails: {
          shopName: 'Eco Test Store',
          category: 'retail',
          address: '123 Green St, Eco City',
          phone: '9876543210'
        }
      });
      console.log('Test shopkeeper created successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createShopkeeper();
