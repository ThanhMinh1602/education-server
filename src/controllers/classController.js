const Class = require('../models/Class');
const User = require('../models/User');
const {
  successResponse,
  errorResponse,
  listResponse,
} = require('../utils/response');
const { ClassResource, UserResource, collection } = require('../resources');
const { USER_ROLES } = require('../constants/enums');

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
    const { name, description, thumbnail, schedule } = req.body;

    // 1️⃣ Kiểm tra trùng tên lớp (theo giáo viên)
    const existedClass = await Class.findOne({
      name: name.trim(),
      teacherId: req.user.id,
    });

    if (existedClass) {
      return errorResponse(res, 'Tên lớp đã tồn tại', 400);
    }

    // 2️⃣ Tự động sinh mã lớp
    const code = await generateClassCode();

    const newClass = await Class.create({
      name: name.trim(),
      description,
      thumbnail,
      code,
      teacherId: req.user.id,
      schedule
    });

    return successResponse(
      res,
      ClassResource(newClass),
      'Tạo lớp học thành công',
      201,
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Cập nhật thông tin lớp học (Tên, ảnh, trạng thái...)
// @route   PUT /api/classes/:id
exports.updateClass = async (req, res) => {
  try {
    const { name, description, thumbnail, isActive, schedule } = req.body;
    const classId = req.params.id;

    // 1. Tìm lớp học
    const classData = await Class.findById(classId);

    if (!classData) {
      return errorResponse(res, 'Không tìm thấy lớp học', 404);
    }

    // 2. Check quyền: Chỉ Giáo viên sở hữu (hoặc Admin) mới được sửa
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      classData.teacherId.toString() !== req.user.id
    ) {
      return errorResponse(res, 'Bạn không có quyền chỉnh sửa lớp này', 403);
    }

    // 3. Logic update từng trường
    // Nếu có gửi name mới và khác name cũ -> Check trùng
    if (name && name.trim() !== classData.name) {
      const duplicateClass = await Class.findOne({
        name: name.trim(),
        teacherId: req.user.id, // Check trùng trong phạm vi các lớp của GV này
      });

      if (duplicateClass) {
        return errorResponse(
          res,
          'Tên lớp đã tồn tại, vui lòng chọn tên khác',
          400,
        );
      }
      classData.name = name.trim();
    }

    if (description !== undefined) classData.description = description;
    if (thumbnail !== undefined) classData.thumbnail = thumbnail;
    if (schedule !== undefined) classData.schedule = schedule;


    // Xử lý trạng thái khóa/mở lớp
    if (isActive !== undefined) {
      classData.isActive = isActive;
    }

    // 4. Lưu vào DB
    const updatedClass = await classData.save();

    return successResponse(
      res,
      ClassResource(updatedClass),
      'Cập nhật lớp học thành công',
    );
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
    if (req.user.role === USER_ROLES.TEACHER) {
      // Giáo viên: Chỉ thấy lớp mình dạy
      query = { teacherId: req.user.id };
    } else if (req.user.role === USER_ROLES.STUDENT) {
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
      collection(classes, ClassResource),
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
      .populate('teacherId', 'name email avatar')
      .populate('studentIds', 'name username avatar avgScore'); // Lấy list học viên

    if (!classData) {
      return errorResponse(res, 'Không tìm thấy lớp học', 404);
    }

    // Bảo mật: Học viên không thuộc lớp này thì không được xem chi tiết (Tùy logic dự án)
    if (
      req.user.role === USER_ROLES.STUDENT &&
      !classData.studentIds.some((s) => s._id.equals(req.user.id))
    ) {
      return errorResponse(res, 'Bạn không phải thành viên của lớp này', 403);
    }

    return successResponse(
      res,
      ClassResource(classData),
      'Lấy thông tin lớp thành công',
    );
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
    if (classToJoin.studentIds.includes(req.user.id)) {
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

    return successResponse(
      res,
      ClassResource(classToJoin),
      'Tham gia lớp học thành công',
    );
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
      req.user.role !== USER_ROLES.ADMIN &&
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

    // Logic: Xóa ID học viên khỏi mảng studentIds của Class
    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { $pull: { studentIds: studentId } },
      { new: true },
    );

    // Logic: Xóa ID lớp khỏi mảng classes của User
    await User.findByIdAndUpdate(studentId, {
      $pull: { classes: classId },
    });

    return successResponse(
      res,
      ClassResource(updatedClass),
      'Đã xóa học viên khỏi lớp',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};
