const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Assignment:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "Bài tập về nhà buổi 1"
 *         classId:
 *           type: string
 *           description: ID lớp học
 *         questionPackId:
 *           type: string
 *           description: ID gói câu hỏi
 *         teacherId:
 *           type: string
 *           description: ID giáo viên giao bài
 *         startTime:
 *           type: string
 *           format: date-time
 *           example: "2026-02-01T08:00:00.000Z"
 *         dueDate:
 *           type: string
 *           format: date-time
 *           example: "2026-02-05T23:59:59.000Z"
 *         settings:
 *           type: object
 *           properties:
 *             showResultImmediately:
 *               type: boolean
 *               example: true
 *             maxAttempts:
 *               type: number
 *               example: 1
 *             durationMinutes:
 *               type: number
 *               example: 45
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const assignmentSchema = new mongoose.Schema(
  {
    // Tên bài tập hiển thị cho HS (VD: "Bài tập về nhà buổi 1")
    title: { type: String, required: true },

    // Giao cho lớp nào?
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },

    // Lấy gói câu hỏi nào để giao?
    questionPackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionPack',
      required: true,
    },

    // Giáo viên nào giao?
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Thời gian bắt đầu mở bài
    startTime: { type: Date, default: Date.now },

    // Hạn chót nộp bài
    dueDate: { type: Date },

    // Cài đặt nâng cao
    settings: {
      showResultImmediately: { type: Boolean, default: true },
      maxAttempts: { type: Number, default: 1 },
      durationMinutes: { type: Number, default: 45 },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Assignment', assignmentSchema);
