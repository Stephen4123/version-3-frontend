const ProgramGuide = require('../models/ProgramGuide');
const { createSlug, generateUniqueSlug } = require('../utils/slugify');

/**
 * ADMIN: return ALL programs (no published filter by default)
 */
exports.getAllPrograms = async (req, res) => {
  console.log(`🔍 [programController.getAllPrograms] ${req.method} ${req.originalUrl}`);
  try {
    const { limit = 100, page = 1, published } = req.query;

    const query = {};
    if (typeof published !== 'undefined') {
      query.published = published === 'true' || published === true;
    }

    console.log('📌 [programController.getAllPrograms] query:', query);
    console.log('📌 [programController.getAllPrograms] model collection:', ProgramGuide.collection?.name);

    const [total, programs] = await Promise.all([
      ProgramGuide.countDocuments(query),
      ProgramGuide.find(query)
        .sort({ id: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .lean()
    ]);

    console.log(`✅ [programController.getAllPrograms] found ${programs.length}/${total} programs`);

    return res.json({
      success: true,
      data: programs,
      pagination: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) }
    });
  } catch (error) {
    console.error('❌ [programController.getAllPrograms] error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProgramById = async (req, res) => {
  try {
    const program = await ProgramGuide.findById(req.params.id);
    if (!program) return res.status(404).json({ success: false, error: 'Program not found' });
    return res.json({ success: true, data: program });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProgramBySlug = async (req, res) => {
  try {
    const program = await ProgramGuide.findOne({ slug: req.params.slug });
    if (!program) return res.status(404).json({ success: false, error: 'Program not found' });
    return res.json({ success: true, data: program });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.createProgram = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.title && !body.slug) {
      body.slug = await generateUniqueSlug(ProgramGuide, createSlug(body.title));
    }
    const program = await ProgramGuide.create(body);
    return res.status(201).json({ success: true, data: program });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateProgram = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.title) {
      body.slug = await generateUniqueSlug(ProgramGuide, createSlug(body.title));
    }
    const program = await ProgramGuide.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!program) return res.status(404).json({ success: false, error: 'Program not found' });
    return res.json({ success: true, data: program });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteProgram = async (req, res) => {
  try {
    const program = await ProgramGuide.findByIdAndDelete(req.params.id);
    if (!program) return res.status(404).json({ success: false, error: 'Program not found' });
    return res.json({ success: true, data: null, message: 'Program deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

