const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  contentHtml: String,
  excerpt: String,
  excerptHtml: String,
  type: { type: String, enum: ['news', 'article', 'poem', 'obituary'], default: 'news' },
  language: { type: String, enum: ['English', 'Malayalam', 'Both'], default: 'English' },
  author: String,
  authorImage: String,
  cover: String,
  coverImages: [String],
  galleryImages: [String],
  published: { type: Boolean, default: false },
  publishDate: { type: Date, default: Date.now },
  viewCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);