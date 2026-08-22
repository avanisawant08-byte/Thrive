const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkNgos() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const ngos = await db.collection('ngos').find().toArray();
    console.log('NGOs:');
    for (let n of ngos) {
      console.log(`- ${n.name} (${n.email}) - Status: ${n.status}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error checking ngos:', err);
    process.exit(1);
  }
}

checkNgos();
