const express = require('express');
const Post = require('../models/Post');
const Voice = require('../models/Voice');
const Speech = require('../models/Speech');
const ProgramGuide = require('../models/ProgramGuide');
const Contributor = require('../models/Contributor');
const BoardMember = require('../models/BoardMember');
const Video = require('../models/Video');
const Notice = require('../models/Notice');
const { SiteSetting } = require('../models/SiteSetting');

const router = express.Router();

// Get all site data for frontend
router.get('/site', async (req, res) => {
  try {
    const [posts, voices, speeches, programs, contributors, boardMembers, videos, notices, settings] = await Promise.all([
      Post.find({ published: true }).sort({ publishDate: -1 }).limit(50).lean(),
      Voice.find({ status: 'approved' }).sort({ date: -1 }).limit(50).lean(),
      Speech.find({ published: true }).sort({ date: -1 }).limit(50).lean(),
      ProgramGuide.find({ published: true }).sort({ id: -1 }).limit(20).lean(),
      Contributor.find({ active: true }).sort({ order: 1 }).lean(),
      BoardMember.find({ active: true }).sort({ order: 1 }).lean(),
      Video.find({ published: true }).sort({ publishDate: -1 }).limit(30).lean(),
      Notice.find({ active: true }).sort({ order: 1, createdAt: -1 }).lean(),
      SiteSetting.find().lean()
    ]);
    
    // Convert settings to key-value object
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    
    res.json({
      success: true,
      posts,
      voices,
      speeches,
      programs,
      contributors,
      boardMembers,
      videos,
      notices,
      settings: settingsMap
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get voices only
router.get('/voices', async (req, res) => {
  try {
    const voices = await Voice.find({ status: 'approved' })
      .sort({ date: -1 })
      .lean();
    res.json({ success: true, data: voices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit voice (public)
router.post('/voices/submit', async (req, res) => {
  try {
    const voice = await Voice.create(req.body);
    res.json({ success: true, data: voice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get posts by type
router.get('/posts/:type', async (req, res) => {
  try {
    const posts = await Post.find({ 
      published: true, 
      type: req.params.type 
    }).sort({ publishDate: -1 }).lean();
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single post by slug
router.get('/post/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, published: true }).lean();
    if (post) {
      await Post.updateOne({ _id: post._id }, { $inc: { viewCount: 1 } });
    }
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single voice by id
router.get('/voice/:id', async (req, res) => {
  try {
    const voice = await Voice.findOne({ id: parseInt(req.params.id), status: 'approved' }).lean();
    if (voice) {
      await Voice.updateOne({ _id: voice._id }, { $inc: { viewCount: 1 } });
    }
    res.json({ success: true, data: voice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single speech by id
router.get('/speech/:id', async (req, res) => {
  try {
    const speech = await Speech.findOne({ id: parseInt(req.params.id), published: true }).lean();
    if (speech) {
      await Speech.updateOne({ _id: speech._id }, { $inc: { viewCount: 1 } });
    }
    res.json({ success: true, data: speech });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get program by slug
router.get('/program/:slug', async (req, res) => {
  try {
    const program = await ProgramGuide.findOne({ slug: req.params.slug, published: true }).lean();
    res.json({ success: true, data: program });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get board member by slug
router.get('/board-member/:slug', async (req, res) => {
  try {
    const member = await BoardMember.findOne({ slug: req.params.slug, active: true }).lean();
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get contributor by slug
router.get('/contributor/:slug', async (req, res) => {
  try {
    const contributor = await Contributor.findOne({ slug: req.params.slug, active: true }).lean();
    res.json({ success: true, data: contributor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get site settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await SiteSetting.find().lean();
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json({ success: true, settings: settingsMap });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;