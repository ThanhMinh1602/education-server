const userResource = require('./userResource');
const assignmentResource = require('./assignmentResource');
const questionResource = require('./questionResource');
const { collection } = require('./index');

const submissionResource = (submission) => {
  if (!submission) return null;

  // Đôi khi submission là ID (do chưa populate), ta check xem nó có phải object không
  const isObject =
    typeof submission === 'object' && submission !== null && submission._id;
  if (!isObject) return submission; // Trả về ID nếu chưa populate

  return {
    id: submission._id,
    assignmentId: submission.assignmentId,

    // Thông tin học viên (format bằng userResource)
    student: submission.studentId?.name
      ? userResource(submission.studentId)
      : submission.studentId,

    score: submission.score,
    submittedAt: submission.submittedAt,
    details: Array.isArray(submission.details)
      ? submission.details.map((detail) => {
          return {
            // Tái sử dụng QuestionResource để format câu hỏi gốc
            // Lưu ý: detail.questionId trong DB chính là Object Question đã được populate
            question: questionResource(detail.questionId),

            // Câu trả lời của học sinh
            studentAnswer: detail.studentAnswer,

            // Kết quả chấm
            isCorrect: detail.isCorrect,
            earnedPoint: detail.earnedPoint,
          };
        })
      : [],
    status: submission.status,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
};

module.exports = submissionResource;
