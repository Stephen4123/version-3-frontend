const Speech = require('../models/Speech');
const { createSlug } = require('../utils/slugify');

/**
 * ADMIN: return ALL speeches (no published filter by default)
 */
exports.getAllSpeeches = async (req, res) => {
  console.log(`🔍 [speechController.getAllSpeeches] ${req.method} ${req.originalUrl}`);
  try {
    const { limit = 100, page = 1, published } = req.query;

    const query = {};
    if (typeof published !== 'undefined') {
      query.published = published === 'true' || published === true;
    }

    console.log('📌 [speechController.getAllSpeeches] query:', query);
    console.log('📌 [speechController.getAllSpeeches] model collection:', Speech.collection?.name);

    const [total, speeches] = await Promise.all([
      Speech.countDocuments(query),
      Speech.find(query)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .lean()
    ]);

    console.log(`✅ [speechController.getAllSpeeches] found ${speeches.length}/${total} speeches`);

    return res.json({
      success: true,
      data: speeches,
      pagination: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) }
    });
  } catch (error) {
    console.error('❌ [speechController.getAllSpeeches] error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSpeechById = async (req, res) => {
  try {
    const speech = await Speech.findById(req.params.id);
    if (!speech) return res.status(404).json({ success: false, error: 'Speech not found' });
    return res.json({ success: true, data: speech });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.createSpeech = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.title && !body.slug) body.slug = createSlug(body.title);
    const speech = await Speech.create(body);
    return res.status(201).json({ success: true, data: speech });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateSpeech = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.title) body.slug = createSlug(body.title);
    const speech = await Speech.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!speech) return res.status(404).json({ success: false, error: 'Speech not found' });
    return res.json({ success: true, data: speech });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteSpeech = async (req, res) => {
  try {
    const speech = await Speech.findByIdAndDelete(req.params.id);
    if (!speech) return res.status(404).json({ success: false, error: 'Speech not found' });
    return res.json({ success: true, data: null, message: 'Speech deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

