const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Question = require('../models/Question');
const Class = require('../models/Class');
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
      if (typeof content.isTrue === 'boolean') {
        return content.isTrue === studentAnswer;
      }
      const correct = content.options?.find((opt) => opt.isCorrect);
      if (correct) {
        return (
          (correct.id === 'true' && studentAnswer === true) ||
          (correct.id === 'false' && studentAnswer === false) ||
          correct.id === studentAnswer
        );
      }
      return false;
    }

    if (type === 'TYPING') {
      const userAnswerParams = studentAnswer.trim().toLowerCase();
      const answers = content.keywords || content.acceptableAnswers || [];
      return answers.some((k) => k.trim().toLowerCase() === userAnswerParams);
    }

    if (type === 'ARRANGE') {
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

    const classData = await Class.findById(assignment.classId);
    if (
      !classData ||
      !classData.studentIds.some((id) => id.toString() === req.user.id)
    ) {
      return errorResponse(res, 'Bạn không thuộc lớp học của bài tập này', 403);
    }

    const now = new Date();
    if (assignment.startTime && now < new Date(assignment.startTime)) {
      return errorResponse(res, 'Bài tập chưa mở', 400);
    }

    const maxAttempts = assignment.settings?.maxAttempts ?? 1;
    const existingSubmission = await Submission.findOne({
      assignmentId,
      studentId: req.user.id,
    });

    if (existingSubmission && maxAttempts <= 1) {
      return errorResponse(res, 'Bạn đã hết lượt nộp bài', 400);
    }

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
    const status =
      assignment.dueDate && now > new Date(assignment.dueDate)
        ? 'LATE'
        : 'SUBMITTED';

    let submission = existingSubmission;

    if (submission) {
      submission.score = finalScore10;
      submission.details = details;
      submission.submittedAt = now;
      submission.status = status;
      await submission.save();
    } else {
      submission = await Submission.create({
        assignmentId,
        studentId: req.user.id,
        score: finalScore10,
        details,
        status,
      });
    }

    const responseData = { submissionId: submission._id };
    if (assignment.settings?.showResultImmediately !== false) {
      responseData.score = finalScore10;
    }

    return successResponse(res, responseData, 'Nộp bài thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Xem chi tiết lịch sử làm bài (Review lại)
// @route   GET /api/assignments/:id/history
exports.getSubmissionHistory = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return errorResponse(res, 'Bài tập không tồn tại', 404);

    const submission = await Submission.findOne({
      assignmentId: req.params.id,
      studentId: req.user.id,
    }).populate('details.questionId');

    if (!submission) return errorResponse(res, 'Bạn chưa làm bài tập này', 404);

    const showResult = assignment.settings?.showResultImmediately !== false;
    const data = submission.toObject();

    if (!showResult) {
      data.score = undefined;
      data.details = data.details.map((d) => ({
        ...d,
        isCorrect: undefined,
        earnedPoint: undefined,
        questionId: d.questionId
          ? { _id: d.questionId._id, type: d.questionId.type, point: d.questionId.point }
          : d.questionId,
      }));
    }

    return successResponse(res, data, 'Lấy lịch sử làm bài thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};
