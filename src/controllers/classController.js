const Class = require('../models/Class');
const User = require('../models/User');
const {
  successResponse,
  errorResponse,
  listResponse,
} = require('../utils/response');

// --- HÀM HELPER: Sinh mã lớp ngẫu nhiên (6 ký tự) ---
const generateClassCode = async () => {
  let code;
  let isExists = true;
  // Vòng lặp để đảm bảo mã sinh ra chưa từng tồn tại
  while (isExists) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const check = await Class.findOne({ code });
    if (!check) isExists = false;
  }
  return code;
};

// @desc    Tạo lớp học mới (Giáo viên)
// @route   POST /api/classes
exports.createClass = async (req, res) => {
  try {
    const { name, description, thumbnail } = req.body;

    // Tự động sinh mã lớp
    const code = await generateClassCode();

    const newClass = await Class.create({
      name,
      description,
      thumbnail,
      code,
      teacherId: req.user.id, // Lấy ID của giáo viên đang login
    });

    return successResponse(res, newClass, 'Tạo lớp học thành công', 201);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Lấy danh sách lớp học (Tùy theo Role)
// @route   GET /api/classes
exports.getClasses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    // Logic phân quyền xem danh sách
    if (req.user.role === 'teacher') {
      // Giáo viên: Chỉ thấy lớp mình dạy
      query = { teacherId: req.user.id };
    } else if (req.user.role === 'student') {
      // Học viên: Chỉ thấy lớp mình đang tham gia
      query = { studentIds: req.user.id };
    }
    // Admin thấy tất cả (query rỗng)

    const [classes, total] = await Promise.all([
      Class.find(query)
        .populate('teacherId', 'name avatar') // Hiện tên GV
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Class.countDocuments(query),
    ]);

    return listResponse(
      res,
      classes,
      total,
      page,
      limit,
      'Lấy danh sách lớp thành công',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Xem chi tiết lớp (Kèm danh sách thành viên)
// @route   GET /api/classes/:id
exports.getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('teacherId', 'name username avatar')
      .populate('studentIds', 'name username avatar avgScore');

    if (!classData) {
      return errorResponse(res, 'Không tìm thấy lớp học', 404);
    }

    const isAdmin = req.user.role === 'admin';
    const isTeacher = classData.teacherId._id.toString() === req.user.id;
    const isStudent = classData.studentIds.some(
      (s) => s._id.toString() === req.user.id,
    );

    if (!isAdmin && !isTeacher && !isStudent) {
      return errorResponse(res, 'Bạn không có quyền xem lớp này', 403);
    }

    return successResponse(res, classData, 'Lấy thông tin lớp thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Học viên tham gia lớp bằng Mã Code
// @route   POST /api/classes/join
exports.joinClass = async (req, res) => {
  try {
    const { code } = req.body;

    // 1. Tìm lớp theo mã
    const classToJoin = await Class.findOne({ code: code.toUpperCase() });

    if (!classToJoin) {
      return errorResponse(res, 'Mã lớp không tồn tại', 404);
    }

    if (!classToJoin.isActive) {
      return errorResponse(res, 'Lớp học này đã bị khóa', 400);
    }

    // 2. Kiểm tra đã tham gia chưa
    const alreadyJoined = classToJoin.studentIds.some(
      (id) => id.toString() === req.user.id,
    );
    if (alreadyJoined) {
      return errorResponse(res, 'Bạn đã tham gia lớp học này rồi', 400);
    }

    // 3. Cập nhật 2 chiều (Transaction mềm)
    // - Thêm User vào Class
    classToJoin.studentIds.push(req.user.id);
    await classToJoin.save();

    // - Thêm Class vào User
    await User.findByIdAndUpdate(req.user.id, {
      $push: { classes: classToJoin._id },
    });

    return successResponse(res, classToJoin, 'Tham gia lớp học thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Xóa lớp học
// @route   DELETE /api/classes/:id
exports.deleteClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return errorResponse(res, 'Không tìm thấy lớp học', 404);
    }

    // Chỉ giáo viên sở hữu hoặc admin mới được xóa
    if (
      req.user.role !== 'admin' &&
      classData.teacherId.toString() !== req.user.id
    ) {
      return errorResponse(res, 'Bạn không có quyền xóa lớp này', 403);
    }

    // Xóa lớp
    await classData.deleteOne();

    // TODO (Nâng cao): Xóa ID lớp khỏi danh sách classes của User và xóa các bài tập liên quan
    // Hiện tại để đơn giản ta chỉ xóa lớp.

    return successResponse(res, null, 'Đã xóa lớp học thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Giáo viên mời học viên ra khỏi lớp
// @route   PUT /api/classes/:id/remove-student
exports.removeStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const classId = req.params.id;

    const classData = await Class.findById(classId);
    if (!classData) {
      return errorResponse(res, 'Không tìm thấy lớp học', 404);
    }

    if (
      req.user.role !== 'admin' &&
      classData.teacherId.toString() !== req.user.id
    ) {
      return errorResponse(res, 'Bạn không có quyền thực hiện hành động này', 403);
    }

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { $pull: { studentIds: studentId } },
      { new: true },
    );

    // Logic: Xóa ID lớp khỏi mảng classes của User
    await User.findByIdAndUpdate(studentId, {
      $pull: { classes: classId },
    });

    return successResponse(res, updatedClass, 'Đã xóa học viên khỏi lớp');
  } catch (error) {
    return errorResponse(res, error);
  }
};
