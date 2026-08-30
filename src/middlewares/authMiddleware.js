const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');

// 1. Middleware xác thực: Kiểm tra Token gửi lên
exports.protect = async (req, res, next) => {
  let token;

  // Kiểm tra header có dạng: "Bearer eyJhbGci..."
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Lấy token từ chuỗi "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Giải mã token (Verify)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Tìm user trong DB và gán vào req.user (để các controller sau dùng được)
      // .select('-password') để loại bỏ field password cho an toàn
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return errorResponse(res, 'User không tồn tại', 401);
      }

      if (!req.user.isActive) {
        return errorResponse(res, 'Tài khoản đã bị khóa', 403);
      }

      next();
    } catch (error) {
      console.error(error);
      return errorResponse(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
    }
  }

  if (!token) {
    return errorResponse(res, 'Không có quyền truy cập, vui lòng đăng nhập', 401);
  }
};

// 2. Middleware phân quyền: Chỉ cho phép role cụ thể (VD: chỉ 'teacher')
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Role '${req.user.role}' không có quyền thực hiện hành động này`,
        403,
      );
    }
    next();
  };
};
