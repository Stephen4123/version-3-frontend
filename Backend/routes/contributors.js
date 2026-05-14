const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllContributors,
  getContributorById,
  createContributor,
  updateContributor,
  deleteContributor
} = require('../controllers/contributorController');

const router = express.Router();

// GET /api/admin/contributors
router.get('/', protect, adminOnly, getAllContributors);

// GET /api/admin/contributors/:id
router.get('/:id', protect, adminOnly, getContributorById);

// POST /api/admin/contributors
router.post('/', protect, adminOnly, createContributor);

// PUT /api/admin/contributors/:id
router.put('/:id', protect, adminOnly, updateContributor);

// DELETE /api/admin/contributors/:id
router.delete('/:id', protect, adminOnly, deleteContributor);

module.exports = router;

