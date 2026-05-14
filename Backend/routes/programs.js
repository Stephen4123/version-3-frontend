const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram
} = require('../controllers/programController');

const router = express.Router();

// GET /api/admin/programs
router.get('/', protect, adminOnly, getAllPrograms);

// GET /api/admin/programs/:id
router.get('/:id', protect, adminOnly, getProgramById);

// POST /api/admin/programs
router.post('/', protect, adminOnly, createProgram);

// PUT /api/admin/programs/:id
router.put('/:id', protect, adminOnly, updateProgram);

// DELETE /api/admin/programs/:id
router.delete('/:id', protect, adminOnly, deleteProgram);

module.exports = router;

