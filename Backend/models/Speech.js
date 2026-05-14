const mongoose = require('mongoose');

const speechSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  content: { type: String, required: true },
  excerpt: String,
  authorName: { type: String, required: true },
  authorImage: String,
  date: { type: Date, default: Date.now },
  displayDate: String,
  cardLabel: { type: String, default: 'പ്രസംഗക്കുറിപ്പ്' },
  mainVerseTitle: String,
  mainVerseText: String,
  mainVerseHtml: String,
  published: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 }
}, { timestamps: true });

speechSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    const last = await mongoose.model('Speech').findOne().sort({ id: -1 });
    this.id = last ? last.id + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Speech', speechSchema);