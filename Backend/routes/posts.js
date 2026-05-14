const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/postController');

const router = express.Router();

// GET /api/admin/posts
router.get('/', protect, adminOnly, getAllPosts);

// GET /api/admin/posts/:id
router.get('/:id', protect, adminOnly, getPostById);

// POST /api/admin/posts
router.post('/', protect, adminOnly, createPost);

// PUT /api/admin/posts/:id
router.put('/:id', protect, adminOnly, updatePost);

// DELETE /api/admin/posts/:id
router.delete('/:id', protect, adminOnly, deletePost);

module.exports = router;

