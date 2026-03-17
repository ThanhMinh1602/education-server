const User = require('../models/User');
const Submission = require('../models/Submission'); // <--- Import thiếu
const Class = require('../models/Class'); // <--- Import để dọn dẹp dữ liệu khi xóa user
const mongoose = require('mongoose'); // <--- Import thiếu
const bcrypt = require('bcryptjs');
const {
  listResponse,
  successResponse,
  errorResponse,
} = require('../utils/response');
const { UserResource, collection } = require('../resources');
const { USER_ROLES } = require('../constants/enums');

// Helper: Check ObjectId hợp lệ
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Lấy danh sách tất cả học viên (Có tìm kiếm)
// @route   GET /api/users
// @access  Private (Teacher/Admin)
exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { keyword, role, classId } = req.query;
    
    // Khởi tạo query trống
    const query = {};

    // 1. Filter theo Role (Nếu có truyền lên thì mới lọc, không thì lấy hết)
    if (role) {
      query.role = role;
    }

    // 2. Filter theo Lớp
    if (classId) {
      query.classes = classId; 
    }

    // 3. Tìm kiếm theo từ khóa
    if (keyword) {
      const regex = new RegExp(keyword, 'i');
      query.$or = [{ name: regex }, { username: regex }];
    }

    // Thực thi query song song để tối ưu tốc độ
    const [students, totalItems] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    // Trả về theo cấu trúc pagination mà anh em mình vừa thống nhất ở Flutter
    return listResponse(
      res,
      collection(students, UserResource),
      totalItems, 
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
    if (!isValidId(req.params.id))
      return errorResponse(res, 'ID không hợp lệ', 400);

    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('classes', 'name code thumbnail'); // Lấy thêm thumbnail cho đẹp

    if (!user) {
      return errorResponse(res, 'Không tìm thấy người dùng', 404);
    }

    return successResponse(
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
    let { name, username, password } = req.body;

    // 1. Validate cơ bản
    if (!name || !username || !password) {
      return errorResponse(res, 'Vui lòng điền đầy đủ thông tin', 400);
    }

    // 2. Chuẩn hóa dữ liệu
    username = username.trim().toLowerCase(); // Viết thường username để tránh trùng lặp kiểu 'User' và 'user'
    name = name.trim();

    // 3. Check trùng
    const userExists = await User.findOne({ username });
    if (userExists) {
      return errorResponse(res, 'Tên đăng nhập đã tồn tại', 400);
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username,
      password: hashedPassword,
      role: USER_ROLES.STUDENT,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`, // Tạo avatar mặc định theo tên
    });

    return successResponse(
      res,
      UserResource(user),
      'Tạo học viên thành công',
      201,
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Cập nhật thông tin học viên
// @route   PUT /api/users/:id
// @access  Private (Teacher)
exports.updateUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return errorResponse(res, 'ID không hợp lệ', 400);

    const { name, isActive, password, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'Không tìm thấy người dùng', 404);
    }

    // Cập nhật
    if (name) user.name = name.trim();
    if (isActive !== undefined) user.isActive = isActive;

    // Nếu đổi pass
    if (password && password.trim().length > 0) {
      if (password.length < 6)
        return errorResponse(res, 'Mật khẩu phải từ 6 ký tự', 400);
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    if (role) user.role = role;

    const updatedUser = await user.save();

    return successResponse(
      res,
      UserResource(updatedUser),
      'Cập nhật thông tin thành công',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Xóa học viên
// @route   DELETE /api/users/:id
// @access  Private (Teacher)
exports.deleteUser = async (req, res) => {
  const session = await mongoose.startSession(); // Dùng Transaction cho an toàn
  session.startTransaction();

  try {
    const userId = req.params.id;
    if (!isValidId(userId)) return errorResponse(res, 'ID không hợp lệ', 400);

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return errorResponse(res, 'Không tìm thấy người dùng', 404);
    }

    // 1. Xóa user khỏi bảng User
    await User.findByIdAndDelete(userId).session(session);

    // 2. QUAN TRỌNG: Xóa user khỏi danh sách studentIds của tất cả các Lớp (Class)
    // Nếu không làm bước này, lớp học sẽ chứa ID "ma" không tồn tại -> Lỗi app
    await Class.updateMany(
      { studentIds: userId },
      { $pull: { studentIds: userId } },
    ).session(session);

    // 3. Có thể xóa luôn Submission của user đó nếu muốn sạch data
    await Submission.deleteMany({ studentId: userId }).session(session);

    await session.commitTransaction();
    session.endSession();

    return successResponse(
      res,
      null,
      'Đã xóa học viên và dọn dẹp dữ liệu liên quan',
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return errorResponse(res, error);
  }
};

// @desc    Lấy thông tin cá nhân
// @route   GET /api/users/profile/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate({
      path: 'classes',
      select: 'name code thumbnail description', // Select kỹ những field cần thiết
    });

    if (!user) return errorResponse(res, 'User not found', 404);

    return successResponse(res, UserResource(user), 'Lấy profile thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Đổi mật khẩu cá nhân
// @route   PUT /api/users/profile/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return errorResponse(res, 'Mật khẩu mới phải từ 6 ký tự trở lên', 400);
    }

    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Mật khẩu hiện tại không đúng', 400);
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return successResponse(res, null, 'Đổi mật khẩu thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Lấy thống kê học tập
// @route   GET /api/users/:id/progress
// @access  Private
exports.getStudentProgress = async (req, res) => {
  try {
    const studentId = req.params.id;
    if (!isValidId(studentId))
      return errorResponse(res, 'ID không hợp lệ', 400);

    // 1. Đếm tổng số bài đã nộp (Distinct theo assignmentId để tránh đếm trùng nộp nhiều lần 1 bài)
    const distinctSubmissions = await Submission.distinct('assignmentId', {
      studentId: studentId,
    });
    const totalSubmissions = distinctSubmissions.length;

    // 2. Tính điểm trung bình
    const stats = await Submission.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      // Nhóm theo assignmentId trước để lấy điểm cao nhất của từng bài (nếu làm lại nhiều lần)
      {
        $group: {
          _id: '$assignmentId',
          maxScoreOfAssignment: { $max: '$score' },
        },
      },
      // Sau đó tính trung bình của các bài tập
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$maxScoreOfAssignment' },
        },
      },
    ]);

    const avg = stats.length > 0 ? stats[0].avgScore : 0;

    const data = {
      totalSubmissions,
      avgScore: parseFloat(avg.toFixed(2)),
    };

    return successResponse(res, data, 'Lấy thống kê thành công');
  } catch (error) {
    console.log(error);
    return errorResponse(res, error);
  }
};
