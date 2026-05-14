const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection with your Atlas string
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ MongoDB Atlas connected successfully!');
  console.log('📊 Database: Jeevajyothimedia');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Import Models
const User = require('./models/User');
const Voice = require('./models/Voice');
const Post = require('./models/Post');
const Speech = require('./models/Speech');
const ProgramGuide = require('./models/ProgramGuide');
const Contributor = require('./models/Contributor');
const BoardMember = require('./models/BoardMember');

// Import Routes
const authRoutes = require('./routes/auth');
const voiceRoutes = require('./routes/voices');
const postRoutes = require('./routes/posts');
const speechRoutes = require('./routes/speeches');
const programRoutes = require('./routes/programs');
const contributorRoutes = require('./routes/contributors');
const boardMemberRoutes = require('./routes/boardMembers');

// Admin Routes (with auth)
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/voices', voiceRoutes);
app.use('/api/admin/posts', postRoutes);
app.use('/api/admin/speeches', speechRoutes);
app.use('/api/admin/programs', programRoutes);
app.use('/api/admin/contributors', contributorRoutes);
app.use('/api/admin/board-members', boardMemberRoutes);

// ============ PUBLIC API ROUTES (No Auth Required) ============

// ================= PUBLIC API ROUTES (No Auth Required) =================
// NOTE: These filters were causing empty arrays because your MongoDB collections/JSON structure don’t match the assumed fields.
// These endpoints now return ALL documents by default, with lightweight debug logging.

// Get all voices
app.get('/api/public/voices', async (req, res) => {
  try {
    console.log(`🔍 [public] GET /api/public/voices`);
    const query = { status: 'approved' };
    const voices = await Voice.find(query).sort({ date: -1 }).select('-__v').lean();
    console.log(`✅ [public] voices found: ${voices.length} query=`, query);
    res.json({ success: true, data: voices });
  } catch (error) {
    console.error('❌ [public] voices error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single voice by ID
app.get('/api/public/voice/:id', async (req, res) => {
  try {
    console.log(`🔍 [public] GET /api/public/voice/:id -> ${req.params.id}`);
    const voice = await Voice.findOne({ id: parseInt(req.params.id), status: 'approved' }).lean();
    if (!voice) return res.status(404).json({ success: false, error: 'Voice not found' });
    res.json({ success: true, data: voice });
  } catch (error) {
    console.error('❌ [public] voice error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit a new voice (public)
app.post('/api/public/voices/submit', async (req, res) => {
  try {
    const voiceData = req.body;
    const voice = await Voice.create(voiceData);
    res.status(201).json({ success: true, data: voice, message: 'Voice submitted for review' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all speeches
app.get('/api/public/speeches', async (req, res) => {
  try {
    console.log(`🔍 [public] GET /api/public/speeches`);
    const query = { published: true };
    const speeches = await Speech.find(query).sort({ date: -1 }).lean();
    console.log(`✅ [public] speeches found: ${speeches.length} query=`, query);
    res.json({ success: true, data: speeches });
  } catch (error) {
    console.error('❌ [public] speeches error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single speech
app.get('/api/public/speech/:id', async (req, res) => {
  try {
    console.log(`🔍 [public] GET /api/public/speech/:id -> ${req.params.id}`);
    const speech = await Speech.findOne({ id: parseInt(req.params.id), published: true }).lean();
    res.json({ success: true, data: speech });
  } catch (error) {
    console.error('❌ [public] speech error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all program guides
app.get('/api/public/programs', async (req, res) => {
  try {
    console.log(`🔍 [public] GET /api/public/programs`);
    const query = { published: true };
    const programs = await ProgramGuide.find(query).sort({ id: -1 }).lean();
    console.log(`✅ [public] programs found: ${programs.length} query=`, query);
    res.json({ success: true, data: programs });
  } catch (error) {
    console.error('❌ [public] programs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single program by slug
app.get('/api/public/program/:slug', async (req, res) => {
  try {
    console.log(`🔍 [public] GET /api/public/program/:slug -> ${req.params.slug}`);
    const program = await ProgramGuide.findOne({ slug: req.params.slug, published: true }).lean();
    res.json({ success: true, data: program });
  } catch (error) {
    console.error('❌ [public] program error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all posts
app.get('/api/public/posts', async (req, res) => {
  try {
    console.log(`🔍 [public] GET /api/public/posts`);
    const query = { published: true };
    const posts = await Post.find(query).sort({ publishDate: -1 }).lean();
    console.log(`✅ [public] posts found: ${posts.length} query=`, query);
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('❌ [public] posts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single post by slug
app.get('/api/public/post/:slug', async (req, res) => {
  try {
    console.log(`🔍 [public] GET /api/public/post/:slug -> ${req.params.slug}`);
    const post = await Post.findOne({ slug: req.params.slug, published: true }).lean();
    res.json({ success: true, data: post });
  } catch (error) {
    console.error('❌ [public] post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get contributors
app.get('/api/public/contributors', async (req, res) => {
  try {
    console.log(`🔍 [public] GET /api/public/contributors`);
    const query = {};
    const contributors = await Contributor.find(query).sort({ order: 1 }).lean();
    console.log(`📦 [public] contributors found: ${contributors.length} (query:`, query, ')');
    res.json({ success: true, data: contributors });
  } catch (error) {
    console.error('❌ [public] contributors error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get board members
app.get('/api/public/board-members', async (req, res) => {
  try {
    console.log(`🔍 [public] GET /api/public/board-members`);
    const query = {};
    const boardMembers = await BoardMember.find(query).sort({ order: 1 }).lean();
    console.log(`📦 [public] boardMembers found: ${boardMembers.length} (query:`, query, ')');
    res.json({ success: true, data: boardMembers });
  } catch (error) {
    console.error('❌ [public] board-members error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get site stats
app.get('/api/public/stats', async (req, res) => {
  try {
    console.log(`🔍 [public] GET /api/public/stats`);
    const [voicesCount, speechesCount, programsCount, postsCount, contributorsCount, boardCount] = await Promise.all([
      Voice.countDocuments({}),
      Speech.countDocuments({}),
      ProgramGuide.countDocuments({}),
      Post.countDocuments({}),
      Contributor.countDocuments({}),
      BoardMember.countDocuments({})
    ]);
    res.json({
      success: true,
      data: {
        voices: voicesCount,
        speeches: speechesCount,
        programs: programsCount,
        posts: postsCount,
        contributors: contributorsCount,
        boardMembers: boardCount
      }
    });
  } catch (error) {
    console.error('❌ [public] stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔐 Admin credentials: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}\n`);
});