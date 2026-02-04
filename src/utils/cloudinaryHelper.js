const cloudinary = require('../config/cloudinary');

/**
 * Xóa file trên Cloudinary
 * @param {string} publicId - ID của file (VD: education_app/abcxyz)
 * @param {string} resourceType - Loại file: 'image' (mặc định) hoặc 'video' (cho mp3/audio)
 */
const removeFileCloudinary = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId) return null;

    // Cloudinary coi Audio là 'video' khi xóa
    const type = resourceType === 'audio' ? 'video' : resourceType;

    const result = await cloudinary.v2.uploader.destroy(publicId, {
      resource_type: type,
    });

    return result;
  } catch (error) {
    console.error(`❌ Lỗi xóa file Cloudinary [${publicId}]:`, error);
    throw error;
  }
};

module.exports = { removeFileCloudinary };
