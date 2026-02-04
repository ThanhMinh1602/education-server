const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Class = require('../models/Class');
const {
  successResponse,
  errorResponse,
  listResponse,
} = require('../utils/response');
const {
  AssignmentResource,
  SubmissionResource,
  collection,
} = require('../resources');
const { USER_ROLES, ASSIGNMENT_STATUSES } = require('../constants/enums');

// @desc    Giáo viên giao bài tập cho lớp
// @route   POST /api/assignments
exports.createAssignment = async (req, res) => {
  try {
    const { title, classId, questionPackId, dueDate, settings } = req.body;

    // Validate: Giáo viên có dạy lớp này không?
    const classCheck = await Class.findById(classId);
    if (!classCheck) return errorResponse(res, 'Lớp học không tồn tại', 404);
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      classCheck.teacherId.toString() !== req.user.id
    ) {
      return errorResponse(res, 'Bạn không có quyền giao bài cho lớp này', 403);
    }

    const assignment = await Assignment.create({
      title,
      classId,
      questionPackId,
      teacherId: req.user.id,
      dueDate,
      settings,
    });

    return successResponse(
      res,
      AssignmentResource(assignment),
      'Giao bài tập thành công',
      201,
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Lấy danh sách bài tập (Logic quan trọng cho Student)
// @route   GET /api/assignments
exports.getAssignments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    // 1. Nếu là Giáo viên: Xem các bài mình đã giao
    if (req.user.role === USER_ROLES.TEACHER) {
      query = { teacherId: req.user.id };

      const [assignments, total] = await Promise.all([
        Assignment.find(query)
          .populate('classId', 'name')
          .populate('questionPackId', 'title thumbnail totalQuestions')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Assignment.countDocuments(query),
      ]);
      return listResponse(res, assignments, total, page, limit);
    }

    // 2. Nếu là Học viên: Xem bài tập của các lớp mình đang học
    // Logic: Lấy Assignment -> Kèm theo trạng thái đã làm hay chưa (Submission)
    if (req.user.role === USER_ROLES.STUDENT) {
      // B1: Lấy danh sách ID lớp mình đang học
      const myClassIds = req.user.classes;

      // B2: Tìm assignment thuộc các lớp đó
      query = { classId: { $in: myClassIds } };

      const total = await Assignment.countDocuments(query);

      // B3: Lấy assignments raw
      const assignments = await Assignment.find(query)
        .populate('classId', 'name') // Lấy tên lớp
        .populate('questionPackId', 'title thumbnail totalQuestions') // Lấy thông tin gói câu hỏi
        .sort({ dueDate: 1 }) // Hạn chót gần nhất xếp trước
        .skip(skip)
        .limit(limit)
        .lean(); // .lean() để trả về JSON thuần, dễ chỉnh sửa

      // B4: Map trạng thái (Đã làm chưa?)
      // Duyệt qua từng bài tập, tìm xem có submission nào của user này không
      const data = await Promise.all(
        assignments.map(async (ass) => {
          const submission = await Submission.findOne({
            assignmentId: ass._id,
            studentId: req.user.id,
          }).select('score status submittedAt');

          return {
            ...ass,
            mySubmission: submission || null, // Nếu null nghĩa là chưa làm
            status: submission ? submission.status : ASSIGNMENT_STATUSES.TODO, // TODO, SUBMITTED
          };
        }),
      );

      return listResponse(res, data, total, page, limit);
    }
  } catch (error) {
    return errorResponse(res, error);
  }
};
// ... (Các code cũ giữ nguyên)

// =========================================================
// PHẦN BỔ SUNG: GET DETAIL, UPDATE, DELETE
// =========================================================

// @desc    Lấy chi tiết 1 bài tập
// @route   GET /api/assignments/:id
exports.getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    let assignment = await Assignment.findById(id)
      .populate('classId', 'name')
      .populate('questionPackId', 'title thumbnail totalQuestions')
      .lean();

    if (!assignment) return errorResponse(res, 'Bài tập không tồn tại', 404);

    // 1. Check quyền: Học viên phải thuộc lớp đó mới được xem
    if (req.user.role === USER_ROLES.STUDENT) {
      const isInClass = req.user.classes.some(
        (c) => c.toString() === assignment.classId._id.toString(),
      );

      if (!isInClass) {
        return errorResponse(res, 'Bạn không thuộc lớp học này', 403);
      }

      // Nếu là học viên -> Kèm thêm thông tin Submission của họ
      const submission = await Submission.findOne({
        assignmentId: id,
        studentId: req.user.id,
      }).select('score status submittedAt');

      assignment = {
        ...assignment,
        mySubmission: submission || null,
        status: submission ? submission.status : ASSIGNMENT_STATUSES.TODO,
      };
    }

    // 2. Check quyền: Giáo viên phải là người tạo (hoặc Admin)
    if (
      req.user.role === USER_ROLES.TEACHER &&
      assignment.teacherId.toString() !== req.user.id
    ) {
      return errorResponse(res, 'Bạn không có quyền xem bài tập này', 403);
    }

    return successResponse(res, assignment, 'Lấy chi tiết bài tập thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Cập nhật bài tập (Gia hạn, đổi tên...)
// @route   PUT /api/assignments/:id
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, dueDate, settings, questionPackId } = req.body;

    let assignment = await Assignment.findById(id);
    if (!assignment) return errorResponse(res, 'Bài tập không tồn tại', 404);

    // Check quyền: Chỉ giáo viên tạo bài (hoặc Admin) mới được sửa
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      assignment.teacherId.toString() !== req.user.id
    ) {
      return errorResponse(res, 'Bạn không có quyền sửa bài tập này', 403);
    }

    // Cập nhật dữ liệu
    assignment.title = title || assignment.title;
    assignment.dueDate = dueDate || assignment.dueDate;
    assignment.settings = settings || assignment.settings;

    // Lưu ý: Nếu đổi questionPackId, cần cân nhắc kỹ nếu đã có học sinh nộp bài
    if (questionPackId) assignment.questionPackId = questionPackId;

    await assignment.save();

    return successResponse(
      res,
      AssignmentResource(assignment),
      'Cập nhật bài tập thành công',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Xóa bài tập (Kèm xóa các bài nộp liên quan)
// @route   DELETE /api/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) return errorResponse(res, 'Bài tập không tồn tại', 404);

    // Check quyền
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      assignment.teacherId.toString() !== req.user.id
    ) {
      return errorResponse(res, 'Bạn không có quyền xóa bài tập này', 403);
    }

    // 1. Xóa tất cả Submissions (Bài làm) của học sinh liên quan đến bài tập này
    // Để tránh dữ liệu rác
    await Submission.deleteMany({ assignmentId: id });

    // 2. Xóa bài tập
    await assignment.deleteOne();

    return successResponse(
      res,
      null,
      'Đã xóa bài tập và toàn bộ bài nộp liên quan',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};
