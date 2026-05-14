// api-server.js - Complete read-only API for Jeevajyothi Media frontend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Missing MONGODB_URI in environment');
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(uri)
  .then(() => console.log('✅ [api-server] Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ [api-server] MongoDB connection error:', err);
    process.exit(1);
  });

// Read-only schemas (strict: false) with explicit collection names.
// IMPORTANT: These collection names are guesses based on your project naming.
// If you still see empty arrays, update the `collection:` values to the exact names in MongoDB Atlas.
const voiceSchema = new mongoose.Schema({}, { strict: false, collection: 'voices' });
const postSchema = new mongoose.Schema({}, { strict: false, collection: 'posts' });
const speechSchema = new mongoose.Schema({}, { strict: false, collection: 'speeches' });
const programSchema = new mongoose.Schema({}, { strict: false, collection: 'programguides' });
const contributorSchema = new mongoose.Schema({}, { strict: false, collection: 'contributors' });
const boardMemberSchema = new mongoose.Schema({}, { strict: false, collection: 'boardmembers' });

// Optional collections (not always present)
const videoSchema = new mongoose.Schema({}, { strict: false, collection: 'videos' });
const noticeSchema = new mongoose.Schema({}, { strict: false, collection: 'notices' });
const quoteSchema = new mongoose.Schema({}, { strict: false, collection: 'quotes' });
const siteSchema = new mongoose.Schema({}, { strict: false, collection: 'sitesettings' });
const navigatorSchema = new mongoose.Schema({}, { strict: false, collection: 'navigators' });
const aboutSchema = new mongoose.Schema({}, { strict: false, collection: 'about' });
const contactSchema = new mongoose.Schema({}, { strict: false, collection: 'contact' });
const logoSchema = new mongoose.Schema({}, { strict: false, collection: 'logo' });
const whatsappSchema = new mongoose.Schema({}, { strict: false, collection: 'whatsapp' });

const Voice = mongoose.model('VoiceApi', voiceSchema);
const Post = mongoose.model('PostApi', postSchema);
const Speech = mongoose.model('SpeechApi', speechSchema);
const ProgramGuide = mongoose.model('ProgramGuideApi', programSchema);
const Contributor = mongoose.model('ContributorApi', contributorSchema);
const BoardMember = mongoose.model('BoardMemberApi', boardMemberSchema);

const Video = mongoose.model('VideoApi', videoSchema);
const Notice = mongoose.model('NoticeApi', noticeSchema);
const Quote = mongoose.model('QuoteApi', quoteSchema);
const SiteSetting = mongoose.model('SiteSettingApi', siteSchema);
const Navigator = mongoose.model('NavigatorApi', navigatorSchema);
const About = mongoose.model('AboutApi', aboutSchema);
const Contact = mongoose.model('ContactApi', contactSchema);
const Logo = mongoose.model('LogoApi', logoSchema);
const Whatsapp = mongoose.model('WhatsappApi', whatsappSchema);

function safeLean(x) {
  return Array.isArray(x) ? x : [];
}

// Fetch ALL important data (single call for frontend)
app.get('/api/fetch/all', async (req, res) => {
  try {
    console.log('📊 [api-server] GET /api/fetch/all');

    const [
      voices,
      posts,
      speeches,
      programs,
      contributors,
      boardMembers,
      videos,
      notices,
      quotes,
      site,
      navigators,
      about,
      contact,
      logo,
      whatsapp
    ] = await Promise.all([
      Voice.find({}).sort({ date: -1 }).limit(200).lean(),
      Post.find({}).sort({ publishDate: -1 }).limit(200).lean(),
      Speech.find({}).sort({ date: -1 }).limit(200).lean(),
      ProgramGuide.find({}).sort({ id: -1 }).limit(200).lean(),
      Contributor.find({}).sort({ order: 1 }).lean(),
      BoardMember.find({}).sort({ order: 1 }).lean(),
      Video.find({}).limit(200).lean(),
      Notice.find({}).limit(200).lean(),
      Quote.find({}).limit(200).lean(),
      SiteSetting.findOne({}).lean().catch(() => null),
      Navigator.findOne({}).lean().catch(() => null),
      About.findOne({}).lean().catch(() => null),
      Contact.findOne({}).lean().catch(() => null),
      Logo.findOne({}).lean().catch(() => null),
      Whatsapp.findOne({}).lean().catch(() => null)
    ]);

    console.log(
      `✅ [api-server] counts: voices=${voices?.length || 0}, posts=${posts?.length || 0}, speeches=${speeches?.length || 0}, programs=${programs?.length || 0}`
    );

    res.json({
      success: true,
      data: {
        voices: voices || [],
        posts: posts || [],
        speeches: speeches || [],
        programs: programs || [],
        contributors: contributors || [],
        boardMembers: boardMembers || [],
        videos: videos || [],
        notices: notices || [],
        quotes: quotes || [],
        site: site || null,
        navigators: navigators || null,
        about: about || null,
        contact: contact || null,
        logo: logo || null,
        whatsapp: whatsapp || null
      }
    });
  } catch (error) {
    console.error('❌ [api-server] /api/fetch/all error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fetch/voices', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    console.log('🎤 [api-server] GET /api/fetch/voices limit=', limit);

    const voices = await Voice.find({}).sort({ date: -1, id: -1 }).limit(limit).lean();
    res.json({ success: true, data: safeLean(voices) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fetch/voice/:id', async (req, res) => {
  try {
    const voice = await Voice.findOne({ id: parseInt(req.params.id, 10) }).lean();
    if (!voice) return res.status(404).json({ success: false, error: 'Voice not found' });
    res.json({ success: true, data: voice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fetch/posts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const type = req.query.type;

    const query = {};
    if (type) query.type = type;

    const posts = await Post.find(query).sort({ publishDate: -1 }).limit(limit).lean();
    res.json({ success: true, data: safeLean(posts) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fetch/post/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).lean();
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fetch/speeches', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const speeches = await Speech.find({}).sort({ date: -1 }).limit(limit).lean();
    res.json({ success: true, data: safeLean(speeches) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fetch/speech/:id', async (req, res) => {
  try {
    const speech = await Speech.findOne({ id: parseInt(req.params.id, 10) }).lean();
    if (!speech) return res.status(404).json({ success: false, error: 'Speech not found' });
    res.json({ success: true, data: speech });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fetch/programs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const programs = await ProgramGuide.find({}).sort({ id: -1 }).limit(limit).lean();
    res.json({ success: true, data: safeLean(programs) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fetch/program/:slug', async (req, res) => {
  try {
    const program = await ProgramGuide.findOne({ slug: req.params.slug }).lean();
    if (!program) return res.status(404).json({ success: false, error: 'Program not found' });
    res.json({ success: true, data: program });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fetch/contributors', async (req, res) => {
  try {
    const contributors = await Contributor.find({}).sort({ order: 1 }).lean();
    res.json({ success: true, data: safeLean(contributors) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fetch/board-members', async (req, res) => {
  try {
    const boardMembers = await BoardMember.find({}).sort({ order: 1 }).lean();
    res.json({ success: true, data: safeLean(boardMembers) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT_API_SERVER || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 [api-server] Running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log(' - GET /api/fetch/all');
  console.log(' - GET /api/fetch/voices');
  console.log(' - GET /api/fetch/speeches');
  console.log(' - GET /api/fetch/programs');
  console.log(' - GET /api/fetch/posts');
  console.log(' - GET /api/fetch/contributors');
  console.log(' - GET /api/fetch/board-members');
});

