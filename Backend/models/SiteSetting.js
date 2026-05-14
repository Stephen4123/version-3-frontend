const mongoose = require('mongoose');

const siteSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: String
}, {
  timestamps: true
});

// Pre-defined settings
const defaultSettings = {
  'brand.name': 'Jeevajyothi Media',
  'brand.logo': '',
  'brand.favicon': '',
  'footer.text': 'Believe • Sing • Share',
  'social.facebook': 'https://www.facebook.com/jeevajyothigospelvoice',
  'social.instagram': 'https://www.instagram.com/jeevajyothi_media',
  'social.youtube': 'https://www.youtube.com/@jeevajyothimedia',
  'social.whatsapp': 'https://whatsapp.com/channel/0029Va9LliuJZg4A3wN3aN2g',
  'contact.phone': '+91 80788 64233',
  'contact.email': 'jeevajyothigv@gmail.com',
  'about.content': '<p>Welcome to Jeevajyothi Media — your light of faith...</p>',
  'sidebarAds.left': '',
  'sidebarAds.right': '',
  'sidebarAds.left2': '',
  'sidebarAds.right2': ''
};

module.exports = { SiteSetting: mongoose.model('SiteSetting', siteSettingSchema), defaultSettings };