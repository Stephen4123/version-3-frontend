const express = require('express');
const {
  getAllVoices,
  getVoiceById,
  createVoice,
  updateVoice,
  deleteVoice,
  approveVoice,
  rejectVoice
} = require('../controllers/voiceController');
const { protect, adminOnly, editorOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, adminOnly, getAllVoices)
  .post(protect, adminOnly, createVoice);

router.route('/:id')
  .get(protect, adminOnly, getVoiceById)
  .put(protect, adminOnly, updateVoice)
  .delete(protect, adminOnly, deleteVoice);

router.put('/:id/approve', protect, adminOnly, approveVoice);
router.put('/:id/reject', protect, adminOnly, rejectVoice);

module.exports = router;
