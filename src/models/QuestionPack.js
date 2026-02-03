const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     QuestionPack:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "Bài tập về State Management"
 *         description:
 *           type: string
 *           example: "Các câu hỏi về Bloc, Cubit, Provider"
 *         thumbnail:
 *           type: string
 *           example: "https://example.com/thumbnail.png"
 *         levelId:
 *           type: string
 *           description: ID cấp độ (Level)
 *         teacherId:
 *           type: string
 *           description: ID giáo viên tạo gói
 *         totalQuestions:
 *           type: number
 *           example: 20
 *         isPublic:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const questionPackSchema = new mongoose.Schema(
  {
    // Tên gói (VD: "Bài tập về State Management")
    title: { type: String, required: true },

    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' },

    // Thuộc cấp độ nào? (Liên kết bảng Level)
    levelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Level',
      required: true,
    },

    // Ai là người tạo gói này?
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Tổng số câu hỏi
    totalQuestions: { type: Number, default: 0 },

    // Public = true nghĩa là GV khác cũng thấy và dùng được
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model('QuestionPack', questionPackSchema);
