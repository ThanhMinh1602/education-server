const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/response');

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
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return errorResponse(res, 'Vui lòng nhập đầy đủ thông tin', 400);
    }

    const userExists = await User.findOne({ username });
    if (userExists)
      return errorResponse(res, 'Tên đăng nhập đã tồn tại', 400);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username,
      password: hashedPassword,
      role: 'student',
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return successResponse(
      res,
      { user, accessToken, refreshToken },
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

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return errorResponse(res, 'Sai thông tin đăng nhập', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Tài khoản đã bị khóa', 403);
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return successResponse(
      res,
      { user, accessToken, refreshToken },
      'Đăng nhập thành công',
    );
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
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return errorResponse(
        res,
        'Refresh Token không hợp lệ hoặc đã bị hủy',
        403,
      );
    }

    const newAccessToken = generateAccessToken(user._id);

    return successResponse(
      res,
      { accessToken: newAccessToken },
      'Làm mới token thành công',
    );
  } catch (error) {
    return errorResponse(res, 'Refresh Token hết hạn hoặc lỗi', 403);
  }
};

// @desc    Đăng xuất (Xóa Refresh Token trong DB)
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    return successResponse(res, null, 'Đăng xuất thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};
