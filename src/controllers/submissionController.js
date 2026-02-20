const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Question = require('../models/Question');
const Class = require('../models/Class');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');
const {
  SubmissionResource,
  collection,
  UserResource,
} = require('../resources');
const {
  SUBMISSION_STATUSES,
  QUESTION_TYPES,
  QUESTION_TYPE_VALUES,
  USER_ROLES,
} = require('../constants/enums');

// --- HÀM HELPER: Chấm điểm từng câu ---

// Hàm chấm điểm từng câu
const checkAnswer = (question, studentAnswer) => {
  // Guard clause: Nếu không có câu trả lời từ HS -> Sai luôn
  if (!studentAnswer) return false;

  const { type, content } = question;

  switch (type) {
    // 1. TRẮC NGHIỆM & ĐÚNG SAI
    // Logic: Tìm option đúng trong DB, so sánh ID với cái HS chọn
    case QUESTION_TYPES.MULTIPLE_CHOICE:
    case QUESTION_TYPES.TRUE_FALSE:
      // Tìm đáp án đúng trong DB
      const correctOption = content.options.find((opt) => opt.isCorrect);

      // Kiểm tra:
      // - DB có đáp án đúng không?
      // - HS có gửi selectedOptionId không?
      // - ID có trùng nhau không?
      if (correctOption && studentAnswer.selectedOptionId) {
        return (
          correctOption.id.toString() ===
          studentAnswer.selectedOptionId.toString()
        );
      }
      return false;

    // 2. SẮP XẾP CÂU
    // Logic: So sánh 2 mảng ID xem thứ tự có y hệt nhau không
    case QUESTION_TYPES.ARRANGE:
      if (!content.correctOrder || !studentAnswer.orderedIds) return false;

      // Check độ dài
      if (content.correctOrder.length !== studentAnswer.orderedIds.length)
        return false;

      // Check từng vị trí (Index)
      for (let i = 0; i < content.correctOrder.length; i++) {
        if (
          content.correctOrder[i].toString() !==
          studentAnswer.orderedIds[i].toString()
        ) {
          return false; // Sai một vị trí là sai hết
        }
      }
      return true;

    // 3. ĐIỀN TỪ / NGHE CHÉP
    // Logic: Check xem text HS nhập có nằm trong mảng acceptableAnswers không
    case QUESTION_TYPES.TYPING:
      if (!content.acceptableAnswers || !studentAnswer.text) return false;

      // Trim khoảng trắng và lowercase để so sánh cho dễ dãi hơn
      const studentText = studentAnswer.text.trim().toLowerCase();

      return content.acceptableAnswers.some(
        (ans) => ans.trim().toLowerCase() === studentText,
      );

    default:
      return false;
  }
};

// @route   POST /api/assignments/:id/submit
exports.submitAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { answers } = req.body; // Mảng [{ questionId: "...", answer: {...} }]

    // 1. Lấy thông tin bài tập
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return errorResponse(res, 'Bài tập không tồn tại', 404);

    // 2. Lấy danh sách câu hỏi gốc từ DB
    const questions = await Question.find({
      packId: assignment.questionPackId,
    });

    // 3. TÍNH ĐIỂM
    let totalScore = 0;
    let totalMaxScore = 0;
    const details = [];

    for (const question of questions) {
      // Tìm câu trả lời của HS
      const userAnswerObj = answers.find(
        (a) => a.questionId.toString() === question._id.toString(),
      );

      // Lấy phần dữ liệu trả lời (chính là cái object { selectedOptionId: "B" }...)
      const studentAnswer = userAnswerObj ? userAnswerObj.answer : null;

      // --- GỌI HÀM CHECK ANSWER ---
      const isCorrect = checkAnswer(question, studentAnswer);

      // Cộng điểm
      totalMaxScore += question.point || 1; // Mặc định 1 điểm nếu quên set
      const earnedPoint = isCorrect ? question.point || 1 : 0;
      totalScore += earnedPoint;

      details.push({
        questionId: question._id,
        // Lưu lại câu trả lời để hiển thị lịch sử (Nếu null thì lưu object rỗng hoặc null)
        studentAnswer: studentAnswer,
        isCorrect,
        earnedPoint,
      });
    }

    // Quy đổi về thang 10
    // Tránh chia cho 0 nếu đề không có câu hỏi nào
    const finalScore10 =
      totalMaxScore > 0
        ? parseFloat(((totalScore / totalMaxScore) * 10).toFixed(2)) // Làm tròn 2 số thập phân
        : 0;

    // 4. LƯU SUBMISSION
    let submission = await Submission.findOne({
      assignmentId,
      studentId: req.user.id,
    });

    const submissionData = {
      assignmentId,
      studentId: req.user.id,
      score: finalScore10,
      details,
      submittedAt: Date.now(),
      status: SUBMISSION_STATUSES.SUBMITTED,
      totalCorrect: details.filter((d) => d.isCorrect).length, // Đếm số câu đúng
      totalQuestions: questions.length,
    };

    if (submission) {
      // Nếu nộp lại -> Update
      Object.assign(submission, submissionData);
      await submission.save();
    } else {
      // Nộp mới
      submission = await Submission.create(submissionData);
    }

    return successResponse(
      res,
      {
        score: finalScore10,
        totalCorrect: submissionData.totalCorrect,
        totalQuestions: submissionData.totalQuestions,
        submissionId: submission._id,
      },
      'Nộp bài thành công',
    );
  } catch (error) {
    console.error(error); // Log lỗi ra terminal để debug
    return errorResponse(res, error.message || 'Lỗi hệ thống');
  }
};

// @desc    Xem chi tiết lịch sử làm bài (Review lại)
// @route   GET /api/assignments/:id/history
exports.getSubmissionHistory = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      assignmentId: req.params.id,
      studentId: req.user.id,
    }).populate('details.questionId'); // Populate để hiện lại câu hỏi gốc

    if (!submission) return errorResponse(res, 'Bạn chưa làm bài tập này', 404);

    return successResponse(
      res,
      SubmissionResource(submission),
      'Lấy lịch sử làm bài thành công',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};
// @desc    Lấy danh sách bài nộp của 1 bài tập (Cho GV chấm điểm/xem tiến độ)
// @route   GET /api/assignments/:id/submissions
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Lấy thông tin bài tập để biết classId
    const assignment = await Assignment.findById(id);
    if (!assignment) return errorResponse(res, 'Bài tập không tồn tại', 404);
    console.log(req.user);

    // 2. Check quyền: Admin hoặc GV dạy lớp đó
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      (req.user.role !== USER_ROLES.TEACHER ||
        assignment.teacherId.toString() !== req.user.id)
    ) {
      return errorResponse(res, 'Bạn không có quyền xem danh sách này', 403);
    }

    // 3. Lấy danh sách HỌC SINH trong lớp
    const classInfo = await Class.findById(assignment.classId).populate(
      'studentIds',
      'name avatar email code',
    );
    if (!classInfo) return errorResponse(res, 'Lớp học không tồn tại', 404);

    // 4. Lấy danh sách BÀI NỘP (Đã có select totalCorrect và totalQuestions)
    const submissions = await Submission.find({ assignmentId: id }).select(
      'studentId score status submittedAt totalCorrect totalQuestions',
    );

    // 5. GHÉP DỮ LIỆU (Mapping)
    const results = classInfo.studentIds.map((student) => {
      const sub = submissions.find(
        (s) => s.studentId.toString() === student._id.toString(),
      );

      // Xử lý gắn thêm số câu đúng / tổng số câu
      let submissionData = null;
      if (sub) {
        // Lấy dữ liệu từ Resource của bạn
        submissionData = typeof SubmissionResource === 'function' 
            ? SubmissionResource(sub) 
            : { ...sub.toObject() }; // Fallback nếu không có Resource
        
        // Gắn ép thêm 2 trường này vào response
        submissionData.totalCorrect = sub.totalCorrect || 0;
        submissionData.totalQuestions = sub.totalQuestions || 0;
      }

      return {
        student: UserResource(student),
        submission: submissionData,
        status: sub ? sub.status : SUBMISSION_STATUSES.NOT_SUBMITTED,
      };
    });

    // Thống kê sơ bộ
    const stats = {
      totalStudents: classInfo.studentIds.length,
      submitted: submissions.length,
      notSubmitted: classInfo.studentIds.length - submissions.length,
    };

    return successResponse(
      res,
      { stats, students: results },
      'Lấy danh sách nộp bài thành công',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};
