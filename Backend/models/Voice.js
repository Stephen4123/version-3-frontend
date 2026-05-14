const mongoose = require('mongoose');

const voiceSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  contentHtml: {
    type: String
  },
  excerpt: {
    type: String
  },
  authorName: {
    type: String,
    required: true
  },
  authorEmail: {
    type: String,
    required: true
  },
  authorPhone: {
    type: String
  },
  authorImage: {
    type: String
  },
  type: {
    type: String,
    enum: ['Article', 'Testimony', 'Interview', 'Case Study', 'Devotional', 'Essay', 'Editorial', 'Tribute', 'Tutorial', 'Listicle', 'Review'],
    default: 'Article'
  },
  cardLabel: {
    type: String
  },
  displayDate: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  viewCount: {
    type: Number,
    default: 0
  },
  innerImage: String,
  innerImageCaption: String
}, {
  timestamps: true
});

// Auto-increment id
voiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    const lastVoice = await mongoose.model('Voice').findOne().sort({ id: -1 });
    this.id = lastVoice ? lastVoice.id + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Voice', voiceSchema);