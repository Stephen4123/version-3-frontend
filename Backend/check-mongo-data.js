require('dotenv').config();
const mongoose = require('mongoose');

async function checkData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    async function distinctCounts(collectionName, field) {
      const distinctValues = await db.collection(collectionName).distinct(field);
      console.log(`\n📊 ${collectionName} - distinct(${field}):`, distinctValues);

      const counts = {};
      for (const v of distinctValues) {
        const c = await db.collection(collectionName).countDocuments({ [field]: v });
        counts[String(v)] = c;
      }
      console.log(`   Count by ${field}:`, counts);
    }

    async function countAll(collectionName) {
      const c = await db.collection(collectionName).countDocuments();
      console.log(`   Total documents in ${collectionName}:`, c);
      return c;
    }

    // voices
    await distinctCounts('voices', 'status');
    await countAll('voices');

    // posts
    await distinctCounts('posts', 'published');
    await countAll('posts');

    // speeches
    await distinctCounts('speeches', 'published');
    await countAll('speeches');

    // programs
    await distinctCounts('programguides', 'published');
    await countAll('programguides');

    // contributors
    await distinctCounts('contributors', 'active');
    await countAll('contributors');

    // board members
    await distinctCounts('boardmembers', 'active');
    await countAll('boardmembers');

    // Also output collection names currently created by Mongoose models (helps detect mismatch)
    const modelNames = ['Voice', 'Post', 'Speech', 'ProgramGuide', 'Contributor', 'BoardMember'];
    console.log('\n🧭 Mongoose model -> collection (based on schema):');
    for (const name of modelNames) {
      try {
        const m = mongoose.model(name);
        console.log(`   ${name} -> ${m.collection?.name}`);
      } catch {
        // ignore if model isn't registered
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();

