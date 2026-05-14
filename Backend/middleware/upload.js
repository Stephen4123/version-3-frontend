const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');

// Ensure upload directories exist
const uploadDirs = ['uploads/images', 'uploads/avatars', 'uploads/programs', 'uploads/gallery'];
uploadDirs.forEach(dir => fs.ensureDirSync(dir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/images';
    if (file.fieldname === 'avatar' || file.fieldname === 'photo') {
      folder = 'uploads/avatars';
    } else if (file.fieldname === 'programImage') {
      folder = 'uploads/programs';
    } else if (file.fieldname === 'gallery') {
      folder = 'uploads/gallery';
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter
});

// Image optimization middleware
const optimizeImage = async (req, res, next) => {
  if (!req.file) return next();
  
  const filePath = req.file.path;
  const isImage = /\.(jpe?g|png|webp)$/i.test(filePath);
  
  if (isImage) {
    try {
      const optimizedPath = filePath.replace(/\.(jpe?g|png|webp)$/i, '-optimized.$1');
      await sharp(filePath)
        .resize(1200, 1200, { withoutEnlargement: true, fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(optimizedPath);
      
      await fs.unlink(filePath);
      await fs.rename(optimizedPath, filePath);
    } catch (err) {
      console.error('Image optimization failed:', err);
    }
  }
  
  next();
};

module.exports = { upload, optimizeImage };