const { successResponse, errorResponse } = require('../utils/response');
const { removeFileCloudinary } = require('../utils/cloudinaryHelper');

exports.uploadImage = (req, res) => {
  try {
    // 1. Log thử ra terminal để xem cấu trúc thực tế
    console.log('👉 File info:', req.file);

    if (!req.file) {
      return errorResponse(res, 'Không có file được upload', 400);
    }

    // 2. Sử dụng cơ chế Fallback (Dự phòng)
    // Một số phiên bản trả về 'path', số khác trả về 'secure_url'
    const url = req.file.path || req.file.secure_url || req.file.url;
    const publicId = req.file.filename || req.file.public_id;

    const data = {
      url: url,
      publicId: publicId,
      format: req.file.format,
      type: req.file.resource_type || 'image', // Mặc định là image nếu thiếu
    };

    return successResponse(res, data, 'Upload thành công');
  } catch (error) {
    console.error('Upload Error:', error);
    return errorResponse(res, error.message, 500);
  }
};

// @desc    Xóa file trên Cloudinary
// @route   DELETE /api/upload
exports.deleteFile = async (req, res) => {
  try {
    const { publicId, type } = req.body;

    if (!publicId) {
      return errorResponse(
        res,
        'Vui lòng cung cấp publicId của file cần xóa',
        400,
      );
    }

    // Gọi helper để xóa
    // type gửi lên có thể là 'image' hoặc 'video'/'audio'
    await removeFileCloudinary(publicId, type || 'image');

    return successResponse(res, null, 'Đã xóa file thành công');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
