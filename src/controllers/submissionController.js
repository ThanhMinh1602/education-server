const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Question = require('../models/Question');
const { successResponse, errorResponse } = require('../utils/response');

// --- HÀM HELPER: Chấm điểm từng câu ---
const checkAnswer = (question, studentAnswer) => {
  try {
    const { type, content } = question;

    // 1. Trắc nghiệm (User gửi lên optionId: "A")
    if (type === 'MULTIPLE_CHOICE') {
      const correctOption = content.options.find((opt) => opt.isCorrect);
      return correctOption && correctOption.id === studentAnswer;
    }

    // 2. Đúng/Sai (User gửi lên boolean: true/false)
    if (type === 'TRUE_FALSE') {
      return content.isTrue === studentAnswer;
    }

    // 3. Typing (User gửi lên text: "Clean Architecture")
    if (type === 'TYPING') {
      // So sánh không phân biệt hoa thường, xóa khoảng trắng thừa
      const userAnswerParams = studentAnswer.trim().toLowerCase();
      // Kiểm tra xem đáp án user có nằm trong danh sách từ khóa đúng không
      return content.keywords.some(
        (k) => k.trim().toLowerCase() === userAnswerParams,
      );
    }

    // 4. Sắp xếp (User gửi lên mảng index: [2, 0, 1])
    if (type === 'ARRANGE') {
      // So sánh 2 mảng có giống hệt nhau không
      return (
        JSON.stringify(content.correctOrder) === JSON.stringify(studentAnswer)
      );
    }

    return false;
  } catch (e) {
    return false;
  }
};

// @desc    Nộp bài tập
// @route   POST /api/assignments/:id/submit
exports.submitAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { answers } = req.body; // Mảng [{ questionId: "...", answer: "..." }]

    // 1. Lấy thông tin bài tập
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return errorResponse(res, 'Bài tập không tồn tại', 404);

    // 2. Lấy danh sách câu hỏi gốc từ DB (để lấy đáp án đúng)
    const questions = await Question.find({
      packId: assignment.questionPackId,
    });

    // 3. Tính điểm
    let totalScore = 0;
    let totalMaxScore = 0; // Tổng điểm tối đa của đề
    const details = [];

    // Duyệt qua từng câu hỏi trong đề
    for (const question of questions) {
      // Tìm câu trả lời của HS cho câu hỏi này
      const userAnswerObj = answers.find(
        (a) => a.questionId === question._id.toString(),
      );
      const studentAnswer = userAnswerObj ? userAnswerObj.answer : null;

      // Chấm điểm
      const isCorrect = studentAnswer
        ? checkAnswer(question, studentAnswer)
        : false;

      // Cộng điểm
      totalMaxScore += question.point;
      const earnedPoint = isCorrect ? question.point : 0;
      totalScore += earnedPoint;

      details.push({
        questionId: question._id,
        studentAnswer,
        isCorrect,
        earnedPoint,
      });
    }

    // Quy đổi về thang điểm 10 (nếu muốn)
    // Ví dụ: Tổng điểm câu hỏi là 5 -> Quy về 10: (3/5)*10 = 6
    const finalScore10 =
      totalMaxScore > 0 ? (totalScore / totalMaxScore) * 10 : 0;

    // 4. Lưu Submission
    // Kiểm tra xem nộp lại hay nộp mới (Tùy logic, ở đây mình cho phép ghi đè hoặc tạo mới)
    // Tốt nhất là tạo mới nếu cho làm nhiều lần. Ở đây mình làm logic: Update nếu đã có.
    let submission = await Submission.findOne({
      assignmentId,
      studentId: req.user.id,
    });

    if (submission) {
      submission.score = finalScore10;
      submission.details = details;
      submission.submittedAt = Date.now();
    } else {
      submission = await Submission.create({
        assignmentId,
        studentId: req.user.id,
        score: finalScore10,
        details,
        status: 'SUBMITTED', // Có thể check logic nộp muộn (LATE) ở đây
      });
    }

    return successResponse(
      res,
      { score: finalScore10, submissionId: submission._id },
      'Nộp bài thành công',
    );
  } catch (error) {
    return errorResponse(res, error);
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

    return successResponse(res, submission, 'Lấy lịch sử làm bài thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};
