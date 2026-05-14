const mongoose = require('mongoose');

const contributorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  picture: String,
  bio: String,
  designation: { type: String, default: 'Contributor' },
  email: String,
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String
  },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Contributor', contributorSchema);