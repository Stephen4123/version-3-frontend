const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllBoardMembers,
  getBoardMemberById,
  createBoardMember,
  updateBoardMember,
  deleteBoardMember
} = require('../controllers/boardMemberController');

const router = express.Router();

// GET /api/admin/board-members
router.get('/', protect, adminOnly, getAllBoardMembers);

// GET /api/admin/board-members/:id
router.get('/:id', protect, adminOnly, getBoardMemberById);

// POST /api/admin/board-members
router.post('/', protect, adminOnly, createBoardMember);

// PUT /api/admin/board-members/:id
router.put('/:id', protect, adminOnly, updateBoardMember);

// DELETE /api/admin/board-members/:id
router.delete('/:id', protect, adminOnly, deleteBoardMember);

module.exports = router;
