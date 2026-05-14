const Post = require('../models/Post');
const { createSlug, generateUniqueSlug } = require('../utils/slugify');

/**
 * ADMIN: return ALL posts (no published filter by default)
 */
exports.getAllPosts = async (req, res) => {
  console.log(`🔍 [postController.getAllPosts] ${req.method} ${req.originalUrl}`);
  try {
    const { limit = 100, page = 1, published } = req.query;

    const query = {};
    if (typeof published !== 'undefined') {
      // allow published=true/false passed from client
      query.published = published === 'true' || published === true;
    }

    console.log('📌 [postController.getAllPosts] query:', query);
    console.log('📌 [postController.getAllPosts] model collection:', Post.collection?.name);

    const [total, posts] = await Promise.all([
      Post.countDocuments(query),
      Post.find(query)
        .sort({ publishDate: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .lean()
    ]);

    console.log(`✅ [postController.getAllPosts] found ${posts.length}/${total} posts`);

    return res.json({
      success: true,
      data: posts,
      pagination: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) }
    });
  } catch (error) {
    console.error('❌ [postController.getAllPosts] error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    return res.json({ success: true, data: post });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const title = req.body?.title;
    const slug = title ? await generateUniqueSlug(Post, createSlug(title)) : undefined;
    const post = await Post.create({ ...req.body, ...(slug ? { slug } : {}) });
    return res.status(201).json({ success: true, data: post });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.title) {
      const newSlug = await generateUniqueSlug(Post, createSlug(updateData.title));
      updateData.slug = newSlug;
    }

    const post = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    return res.json({ success: true, data: post });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    return res.json({ success: true, data: null, message: 'Post deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

