const User = require('../models/User');
const bcrypt = require('bcryptjs');
const {
  listResponse,
  successResponse,
  errorResponse,
} = require('../utils/response');
const { UserResource, collection } = require('../resources');
const { USER_ROLES } = require('../constants/enums');

// @desc    Lấy danh sách tất cả học viên (Có tìm kiếm)
// @route   GET /api/users
// @access  Private (Teacher/Admin)
exports.getStudents = async (req, res) => {
  try {
    // 1. Lấy tham số page, limit từ query url (vd: ?page=1&limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { keyword } = req.query;

    // 2. Xây dựng bộ lọc
    const query = {
      role: USER_ROLES.STUDENT,
      ...(keyword
        ? {
            $or: [
              { name: { $regex: keyword, $options: 'i' } },
              { username: { $regex: keyword, $options: 'i' } },
            ],
          }
        : {}),
    };

    // 3. Query song song: Đếm tổng + Lấy data
    const [students, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip) // Bỏ qua n phần tử
        .limit(limit), // Lấy n phần tử
      User.countDocuments(query), // Đếm tổng số thỏa mãn điều kiện
    ]);

    // 4. Trả về chuẩn format List (đã format bằng UserResource)
    return listResponse(
      res,
      collection(students, UserResource),
      total,
      page,
      limit,
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Lấy chi tiết một học viên
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('classes', 'name code'); // Lấy luôn tên lớp học viên đang học

    if (!user) {
      return errorResponse(res, 'Không tìm thấy người dùng', 404);
    }

    successResponse(
      res,
      UserResource(user),
      'Lấy thông tin học viên thành công',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Giáo viên tạo nhanh tài khoản cho Học viên
// @route   POST /api/users
// @access  Private (Teacher)
exports.createUser = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    // Check trùng
    const userExists = await User.findOne({ username });
    if (userExists) {
      return errorResponse(res, 'Tên đăng nhập đã tồn tại', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username,
      password: hashedPassword,
      role: USER_ROLES.STUDENT, // Mặc định tạo ra là student
    });

    successResponse(res, UserResource(user), 'Tạo học viên thành công', 201);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Cập nhật thông tin học viên
// @route   PUT /api/users/:id
// @access  Private (Teacher)
exports.updateUser = async (req, res) => {
  try {
    const { name, isActive, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'Không tìm thấy người dùng', 404);
    }

    // Cập nhật các trường cơ bản
    user.name = name || user.name;
    if (isActive !== undefined) user.isActive = isActive;

    // Nếu giáo viên muốn đổi mật khẩu cho học viên
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();

    successResponse(
      res,
      UserResource(updatedUser),
      'Cập nhật thông tin học viên thành công',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Xóa học viên
// @route   DELETE /api/users/:id
// @access  Private (Teacher)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return errorResponse(res, 'Không tìm thấy người dùng', 404);
    }

    successResponse(res, null, 'Đã xóa học viên thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};
// @desc    Lấy thông tin cá nhân (Cho user đang login)
// @route   GET /api/users/profile/me
// @access  Private (All roles)
exports.getMe = async (req, res) => {
  try {
    // req.user đã có từ middleware protect
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('classes', 'name code thumbnail'); // Load luôn tên lớp để hiện lên App

    return successResponse(
      res,
      UserResource(user),
      'Lấy thông tin cá nhân thành công',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Người dùng tự cập nhật mật khẩu
// @route   PUT /api/users/profile/change-password
// @access  Private (All roles)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1. Tìm user kèm password để so sánh (vì mặc định select đang ẩn password)
    const user = await User.findById(req.user.id).select('+password');

    // 2. Check pass cũ
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Mật khẩu hiện tại không đúng', 400);
    }

    // 3. Hash pass mới và lưu
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return successResponse(res, null, 'Đổi mật khẩu thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Lấy thống kê học tập của một học viên (Dành cho GV xem chi tiết)
// @route   GET /api/users/:id/progress
// @access  Private (Teacher/Admin)
exports.getStudentProgress = async (req, res) => {
  try {
    const studentId = req.params.id;

    // 1. Đếm tổng số bài đã nộp
    const totalSubmissions = await Submission.countDocuments({ studentId });

    // 2. Tính điểm trung bình
    // Dùng Aggregation của MongoDB để tính toán nhanh
    const stats = await Submission.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      {
        $group: {
          _id: '$studentId',
          avgScore: { $avg: '$score' }, // Tính trung bình trường score
          highestScore: { $max: '$score' },
        },
      },
    ]);

    const data = {
      totalSubmissions,
      avgScore: stats.length > 0 ? stats[0].avgScore.toFixed(2) : 0,
      highestScore: stats.length > 0 ? stats[0].highestScore : 0,
    };

    return successResponse(res, data, 'Lấy thống kê học tập thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};
