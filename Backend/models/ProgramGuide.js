const mongoose = require('mongoose');

const programGuideSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  lead: { type: String, required: true },
  summary: { type: String, required: true },
  image: String,
  verse: String,
  verseText: String,
  sections: [{
    title: String,
    items: [mongoose.Schema.Types.Mixed]
  }],
  howToBegin: {
    title: String,
    steps: [String]
  },
  published: { type: Boolean, default: true }
}, { timestamps: true });

programGuideSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    const last = await mongoose.model('ProgramGuide').findOne().sort({ id: -1 });
    this.id = last ? last.id + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('ProgramGuide', programGuideSchema);