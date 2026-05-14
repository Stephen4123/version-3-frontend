const mongoose = require('mongoose');

const boardMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  picture: String,
  bio: String,
  designation: { type: String, required: true },
  category: {
    type: String,
    enum: ['board', 'honorary', 'associate', 'contributor'],
    default: 'board'
  },
  email: String,
  phone: String,
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String
  },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('BoardMember', boardMemberSchema);