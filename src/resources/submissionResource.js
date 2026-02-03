const userResource = require('./userResource');
const assignmentResource = require('./assignmentResource');

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

    // Chi tiết từng câu trả lời (giữ nguyên structure)
    details: submission.details || [],

    status: submission.status,

    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
};

module.exports = submissionResource;
