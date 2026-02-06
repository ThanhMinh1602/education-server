const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/response');
const { USER_ROLES } = require('../constants/enums');
const UserResource = require('./../resources/userResource');

// --- HELPER FUNCTIONS ---
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });
};
// @desc    Đăng ký
exports.register = async (req, res) => {
  try {
    const { name, username, password, role } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      return errorResponse(res, 'Tên đăng nhập đã tồn tại', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username,
      password: hashedPassword,
      role: role || USER_ROLES.STUDENT,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return successResponse(
      res,
      {
        user: UserResource(user),
        accessToken,
        refreshToken,
      },
      'Đăng ký thành công',
      201,
    );
  } catch (error) {
    return errorResponse(res, error, 500);
  }
};

// @desc    Đăng nhập
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Tạo bộ đôi token mới
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Cập nhật Refresh Token mới vào DB
      user.refreshToken = refreshToken;
      await user.save();

      return successResponse(
        res,
        { user: UserResource(user), accessToken, refreshToken },
        'Đăng nhập thành công',
      );
    } else {
      return errorResponse(res, 'Sai thông tin đăng nhập', 401);
    }
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Lấy Access Token mới bằng Refresh Token
// @route   POST /api/auth/refresh-token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return errorResponse(res, 'Chưa gửi Refresh Token', 401);
  }

  try {
    // 1. Verify xem token có hợp lệ (đúng chữ ký, chưa hết hạn) không
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 2. Tìm user trong DB
    const user = await User.findById(decoded.id);

    // 3. Kiểm tra token trong DB có khớp với token gửi lên không?
    // (Chống trường hợp user đã logout nhưng hacker trộm được token cũ để dùng lại)
    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(403)
        .json({ message: 'Refresh Token không hợp lệ hoặc đã bị hủy' });
    }

    // 4. Cấp Access Token mới
    const newAccessToken = generateAccessToken(user._id);

    return successResponse(
      res,
      { accessToken: newAccessToken },
      'Lấy Access Token mới thành công',
    );
  } catch (error) {
    return errorResponse(res, 'Refresh Token hết hạn hoặc lỗi', 403);
  }
};

// @desc    Đăng xuất (Xóa Refresh Token trong DB)
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const { userId } = req.body; // Hoặc lấy từ middleware auth sau này

    // Tìm user và xóa refresh token đi
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    return successResponse(res, null, 'Đăng xuất thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};
