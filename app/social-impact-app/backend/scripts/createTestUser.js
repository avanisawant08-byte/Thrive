const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'user' },
  coinBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = 'user@test.com';
    const password = 'password123';
    
    let user = await User.findOne({ email });
    if (user) {
      user.coinBalance = 5000;
      await user.save();
      console.log('User updated with 5000 points.');
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      user = await User.create({
        name: 'Test User',
        email,
        passwordHash,
        coinBalance: 5000
      });
      console.log('Test user created with 5000 points!');
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createTestUser();
