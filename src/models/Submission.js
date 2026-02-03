const mongoose = require('mongoose');
const {
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_VALUES,
} = require('../constants/enums');

/**
 * @swagger
 * components:
 *   schemas:
 *     Submission:
 *       type: object
 *       properties:
 *         assignmentId:
 *           type: string
 *           description: ID bài tập
 *         studentId:
 *           type: string
 *           description: ID học viên nộp bài
 *         score:
 *           type: number
 *           example: 8.5
 *         submittedAt:
 *           type: string
 *           format: date-time
 *         details:
 *           type: array
 *           description: Chi tiết từng câu trả lời
 *           items:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *                 description: ID câu hỏi
 *               studentAnswer:
 *                 type: object
 *                 description: Câu trả lời của học viên (linh động theo loại câu hỏi)
 *               isCorrect:
 *                 type: boolean
 *                 example: true
 *               earnedPoint:
 *                 type: number
 *                 example: 1
 *         status:
 *           type: string
 *           enum:
 *             - SUBMITTED
 *             - LATE
 *             - GRADED
 *           example: SUBMITTED
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const submissionSchema = new mongoose.Schema(
  {
    // Nộp cho bài tập nào?
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },

    // Học viên nào nộp?
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Tổng điểm đạt được
    score: { type: Number, default: 0 },

    // Thời gian nộp
    submittedAt: { type: Date, default: Date.now },

    // Chi tiết từng câu trả lời
    details: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        studentAnswer: { type: mongoose.Schema.Types.Mixed },
        isCorrect: { type: Boolean },
        earnedPoint: { type: Number },
      },
    ],

    // Trạng thái bài nộp
    status: {
      type: String,
      enum: SUBMISSION_STATUS_VALUES,
      default: SUBMISSION_STATUSES.SUBMITTED,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Submission', submissionSchema);
