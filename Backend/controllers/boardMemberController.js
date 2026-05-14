const BoardMember = require('../models/BoardMember');
const { createSlug, generateUniqueSlug } = require('../utils/slugify');

/**
 * ADMIN: return ALL board members (no active filter by default)
 */
exports.getAllBoardMembers = async (req, res) => {
  console.log(`🔍 [boardMemberController.getAllBoardMembers] ${req.method} ${req.originalUrl}`);
  try {
    const { limit = 100, page = 1, active } = req.query;

    const query = {};
    if (typeof active !== 'undefined') {
      query.active = active === 'true' || active === true;
    }

    console.log('📌 [boardMemberController.getAllBoardMembers] query:', query);
    console.log('📌 [boardMemberController.getAllBoardMembers] model collection:', BoardMember.collection?.name);

    const [total, members] = await Promise.all([
      BoardMember.countDocuments(query),
      BoardMember.find(query)
        .sort({ order: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .lean()
    ]);

    console.log(`✅ [boardMemberController.getAllBoardMembers] found ${members.length}/${total} board members`);

    return res.json({
      success: true,
      data: members,
      pagination: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) }
    });
  } catch (error) {
    console.error('❌ [boardMemberController.getAllBoardMembers] error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBoardMemberById = async (req, res) => {
  try {
    const member = await BoardMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, error: 'Board member not found' });
    return res.json({ success: true, data: member });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBoardMemberBySlug = async (req, res) => {
  try {
    const member = await BoardMember.findOne({ slug: req.params.slug });
    if (!member) return res.status(404).json({ success: false, error: 'Board member not found' });
    return res.json({ success: true, data: member });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.createBoardMember = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.name && !body.slug) {
      body.slug = await generateUniqueSlug(BoardMember, createSlug(body.name));
    }
    const member = await BoardMember.create(body);
    return res.status(201).json({ success: true, data: member });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateBoardMember = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.name) {
      body.slug = await generateUniqueSlug(BoardMember, createSlug(body.name));
    }
    const member = await BoardMember.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, error: 'Board member not found' });
    return res.json({ success: true, data: member });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteBoardMember = async (req, res) => {
  try {
    const member = await BoardMember.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, error: 'Board member not found' });
    return res.json({ success: true, data: null, message: 'Board member deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

