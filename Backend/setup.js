require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function setup() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    
    // Check if admin exists
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (!adminExists) {
      await User.create({
        name: 'Stephen Sam',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
        isActive: true
      });
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', process.env.ADMIN_EMAIL);
      console.log('🔑 Password:', process.env.ADMIN_PASSWORD);
    } else {
      console.log('ℹ️ Admin user already exists');
      console.log('📧 Email:', process.env.ADMIN_EMAIL);
    }
    
    // Count collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📊 Available collections:');
    collections.forEach(col => console.log('   -', col.name));
    
    console.log('\n✨ Setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    process.exit(1);
  }
}

setup();