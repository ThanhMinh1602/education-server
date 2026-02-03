const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Class = require('../models/Class');
const {
  successResponse,
  errorResponse,
  listResponse,
} = require('../utils/response');

// @desc    Giáo viên giao bài tập cho lớp
// @route   POST /api/assignments
exports.createAssignment = async (req, res) => {
  try {
    const { title, classId, questionPackId, dueDate, settings } = req.body;

    // Validate: Giáo viên có dạy lớp này không?
    const classCheck = await Class.findById(classId);
    if (!classCheck) return errorResponse(res, 'Lớp học không tồn tại', 404);
    if (
      req.user.role !== 'admin' &&
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

    return successResponse(res, assignment, 'Giao bài tập thành công', 201);
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
    if (req.user.role === 'teacher') {
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
    if (req.user.role === 'student') {
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
            status: submission ? submission.status : 'TODO', // TODO, SUBMITTED
          };
        }),
      );

      return listResponse(res, data, total, page, limit);
    }
  } catch (error) {
    return errorResponse(res, error);
  }
};
