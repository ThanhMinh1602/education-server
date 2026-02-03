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
    const { name, username, password, role } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists)
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username,
      password: hashedPassword,
      role: role || 'student',
    });

    if (user) {
      // Tạo bộ đôi token
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Lưu Refresh Token vào DB để quản lý (Logout sẽ xóa nó đi)
      user.refreshToken = refreshToken;
      await user.save();

      return successResponse(res, { user, token }, 'Đăng nhập thành công');
    }
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

      res.json({
        success: true,
        user,
        accessToken,
        refreshToken,
      });
    } else {
      res.status(401).json({ message: 'Sai thông tin đăng nhập' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lấy Access Token mới bằng Refresh Token
// @route   POST /api/auth/refresh-token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Chưa gửi Refresh Token' });
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

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(403).json({ message: 'Refresh Token hết hạn hoặc lỗi' });
  }
};

// @desc    Đăng xuất (Xóa Refresh Token trong DB)
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const { userId } = req.body; // Hoặc lấy từ middleware auth sau này

    // Tìm user và xóa refresh token đi
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
