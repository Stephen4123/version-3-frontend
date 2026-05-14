const slugify = require('slugify');

const createSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
};

const generateUniqueSlug = async (model, baseSlug, field = 'slug') => {
  let slug = baseSlug;
  let counter = 1;
  let exists = await model.findOne({ [field]: slug });
  
  while (exists) {
    slug = `${baseSlug}-${counter}`;
    exists = await model.findOne({ [field]: slug });
    counter++;
  }
  
  return slug;
};

module.exports = { createSlug, generateUniqueSlug };