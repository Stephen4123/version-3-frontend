const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllSpeeches,
  getSpeechById,
  createSpeech,
  updateSpeech,
  deleteSpeech
} = require('../controllers/speechController');

const router = express.Router();

// GET /api/admin/speeches
router.get('/', protect, adminOnly, getAllSpeeches);

// GET /api/admin/speeches/:id
router.get('/:id', protect, adminOnly, getSpeechById);

// POST /api/admin/speeches
router.post('/', protect, adminOnly, createSpeech);

// PUT /api/admin/speeches/:id
router.put('/:id', protect, adminOnly, updateSpeech);

// DELETE /api/admin/speeches/:id
router.delete('/:id', protect, adminOnly, deleteSpeech);

module.exports = router;

