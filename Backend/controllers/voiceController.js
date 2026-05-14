const Voice = require('../models/Voice');
const { createSlug, generateUniqueSlug } = require('../utils/slugify');
const { sendVoiceSubmissionEmail } = require('../utils/email');

/**
 * ADMIN: return ALL voices (no status filter by default)
 */
const getAllVoices = async (req, res) => {
  console.log(`🔍 [voiceController.getAllVoices] ${req.method} ${req.originalUrl}`);
  try {
    const { limit = 100, page = 1, status } = req.query;

    // For admin dashboard we want ALL voices unless caller explicitly passes status.
    const query = {};
    if (status) query.status = status;

    console.log('📌 [voiceController.getAllVoices] query:', query);
    console.log('📌 [voiceController.getAllVoices] model collection:', Voice.collection?.name);

    const [total, voices] = await Promise.all([
      Voice.countDocuments(query),
      Voice.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .lean()
    ]);

    console.log(`✅ [voiceController.getAllVoices] found ${voices.length}/${total} voices`);

    res.json({
      success: true,
      data: voices,
      pagination: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) }
    });
  } catch (error) {
    console.error('❌ [voiceController.getAllVoices] error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getVoiceById = async (req, res) => {
  try {
    const voice = await Voice.findById(req.params.id);
    if (!voice) {
      return res.status(404).json({ success: false, error: 'Voice not found' });
    }
    res.json({ success: true, data: voice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createVoice = async (req, res) => {
  try {
    const voiceData = req.body;
    voiceData.slug = await generateUniqueSlug(Voice, createSlug(voiceData.title));
    
    const voice = await Voice.create(voiceData);
    
    // Send email notifications
    try {
      await sendVoiceSubmissionEmail(voice, process.env.ADMIN_EMAIL);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
    }
    
    res.status(201).json({ success: true, data: voice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateVoice = async (req, res) => {
  try {
    const voice = await Voice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!voice) {
      return res.status(404).json({ success: false, error: 'Voice not found' });
    }
    res.json({ success: true, data: voice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteVoice = async (req, res) => {
  try {
    const voice = await Voice.findByIdAndDelete(req.params.id);
    if (!voice) {
      return res.status(404).json({ success: false, error: 'Voice not found' });
    }
    res.json({ success: true, message: 'Voice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const approveVoice = async (req, res) => {
  try {
    const voice = await Voice.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    );
    if (!voice) {
      return res.status(404).json({ success: false, error: 'Voice not found' });
    }
    res.json({ success: true, data: voice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const rejectVoice = async (req, res) => {
  try {
    const { reason } = req.body;
    const voice = await Voice.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectionReason: reason
      },
      { new: true }
    );
    if (!voice) {
      return res.status(404).json({ success: false, error: 'Voice not found' });
    }
    res.json({ success: true, data: voice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllVoices,
  getVoiceById,
  createVoice,
  updateVoice,
  deleteVoice,
  approveVoice,
  rejectVoice
};