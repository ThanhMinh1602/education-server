const multer = require('multer');
const CloudinaryStorage = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Kiểm tra xem file upload có phải là ảnh không
    const isImage = file.mimetype.startsWith('image');

    // Cấu hình cơ bản
    let uploadParams = {
      folder: 'education_app',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif', 'mp3', 'wav'],
    };

    // Nếu là ẢNH thì mới thêm cấu hình Resize
    if (isImage) {
      uploadParams.transformation = [
        {
          width: 1024, // Giới hạn chiều rộng tối đa 1024px
          crop: 'limit', // Chỉ thu nhỏ nếu ảnh lớn hơn 1024px (không phóng to ảnh nhỏ)
        },
        {
          quality: 'auto', // Tự động tối ưu hóa dung lượng nhưng giữ chất lượng
          fetch_format: 'auto', // Tự động chuyển đổi sang định dạng tốt nhất (vd: webp)
        },
      ];
    }

    return uploadParams;
  },
});
const upload = multer({ storage: storage });

module.exports = upload;
