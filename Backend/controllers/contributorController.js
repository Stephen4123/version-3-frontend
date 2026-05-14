const Contributor = require('../models/Contributor');
const { createSlug, generateUniqueSlug } = require('../utils/slugify');

/**
 * ADMIN: return ALL contributors (no active filter by default)
 */
exports.getAllContributors = async (req, res) => {
  console.log(`🔍 [contributorController.getAllContributors] ${req.method} ${req.originalUrl}`);
  try {
    const { limit = 100, page = 1, active } = req.query;

    const query = {};
    if (typeof active !== 'undefined') {
      query.active = active === 'true' || active === true;
    }

    console.log('📌 [contributorController.getAllContributors] query:', query);
    console.log('📌 [contributorController.getAllContributors] model collection:', Contributor.collection?.name);

    const [total, contributors] = await Promise.all([
      Contributor.countDocuments(query),
      Contributor.find(query)
        .sort({ order: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .lean()
    ]);

    console.log(`✅ [contributorController.getAllContributors] found ${contributors.length}/${total} contributors`);

    return res.json({
      success: true,
      data: contributors,
      pagination: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) }
    });
  } catch (error) {
    console.error('❌ [contributorController.getAllContributors] error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getContributorById = async (req, res) => {
  try {
    const contributor = await Contributor.findById(req.params.id);
    if (!contributor) return res.status(404).json({ success: false, error: 'Contributor not found' });
    return res.json({ success: true, data: contributor });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getContributorBySlug = async (req, res) => {
  try {
    const contributor = await Contributor.findOne({ slug: req.params.slug });
    if (!contributor) return res.status(404).json({ success: false, error: 'Contributor not found' });
    return res.json({ success: true, data: contributor });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.createContributor = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.name && !body.slug) {
      body.slug = await generateUniqueSlug(Contributor, createSlug(body.name));
    }
    const contributor = await Contributor.create(body);
    return res.status(201).json({ success: true, data: contributor });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateContributor = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.name) {
      body.slug = await generateUniqueSlug(Contributor, createSlug(body.name));
    }
    const contributor = await Contributor.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!contributor) return res.status(404).json({ success: false, error: 'Contributor not found' });
    return res.json({ success: true, data: contributor });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteContributor = async (req, res) => {
  try {
    const contributor = await Contributor.findByIdAndDelete(req.params.id);
    if (!contributor) return res.status(404).json({ success: false, error: 'Contributor not found' });
    return res.json({ success: true, data: null, message: 'Contributor deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

