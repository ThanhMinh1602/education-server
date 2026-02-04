const cloudinary = require('cloudinary'); // Import object gốc
const dotenv = require('dotenv');

dotenv.config();

// Cấu hình v2
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Export object gốc để multer-storage-cloudinary tự gọi .v2 bên trong
module.exports = cloudinary;
