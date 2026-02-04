const mongoose = require('mongoose');
const {
  QUESTION_TYPE_VALUES,
  MEDIA_TYPE_VALUES,
} = require('../constants/enums');
/**
 * @swagger
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum:
 *             - MULTIPLE_CHOICE
 *             - ARRANGE
 *             - TRUE_FALSE
 *             - TYPING
 *         mediaUrl:
 *           type: string
 *           description: Link ảnh/audio (nếu có)
 *         mediaType:
 *           type: string
 *           enum:
 *             - IMAGE
 *             - AUDIO
 *             - VIDEO
 *             - NONE
 *         explanation:
 *           type: string
 *           description: Giải thích chi tiết tại sao đúng/sai
 *         point:
 *           type: number
 *           example: 1
 *         content:
 *           type: object
 *           description: |
 *             Dữ liệu JSON tuỳ theo loại câu hỏi:
 *
 *             - MULTIPLE_CHOICE:
 *               { "question": "Đây là đâu?", "options": [{ "id": "A", "text": "Hà Nội", "isCorrect": true }] }
 *
 *             - ARRANGE:
 *               {
 *                 "segments": [{ "id": 1, "text": "Tôi" }, { "id": 2, "text": "Yêu" }, { "id": 3, "text": "Bạn" }],
 *                 "correctOrder": [1, 2, 3],
 *                 "correctText": "Tôi Yêu Bạn"
 *               }
 *
 *             - TRUE_FALSE:
 *               { "statement": "Phía Nam là 北边", "isTrue": false }
 *
 *             - TYPING:
 *               {
 *                 "question": "Dịch: Xin chào",
 *                 "acceptableAnswers": ["Ni hao", "Nǐ hǎo", "你好"]
 *               }
 */

const questionSchema = new mongoose.Schema(
  {
    packId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionPack',
      required: true,
    },

    type: {
      type: String,
      enum: QUESTION_TYPE_VALUES,
      required: true,
    },

    point: { type: Number, default: 1 },

    // --- MỚI: Hỗ trợ đa phương tiện (Ảnh/Audio) ---
    // Dành cho dạng bài: "Nhìn hình chọn từ", "Nghe đoạn hội thoại"
    mediaUrl: { type: String, default: '' },
    mediaPublicId: { type: String, default: '' },
    mediaType: {
      type: String,
      enum: MEDIA_TYPE_VALUES,
      default: MEDIA_TYPE_VALUES.NONE,
    },

    // --- MỚI: Giải thích đáp án ---
    // Hiện ra sau khi học viên nộp bài. VD: "Sai. Bắc Kinh mùa đông -10 độ chứ không phải 20 độ."
    explanation: { type: String, default: '' },

    /**
     * Dữ liệu nội dung (JSON linh động) - Đã nâng cấp cấu trúc:
     * * 1. MULTIPLE_CHOICE (Trắc nghiệm / Nhìn hình):
     * { "question": "Đây là đâu?", "options": [{"id":"A", "text":"Hà Nội", "isCorrect":true}] }
     * * 2. ARRANGE (Sắp xếp câu - Bài 4):
     * {
     * "segments": [{"id":1, "text":"Tôi"}, {"id":2, "text":"Yêu"}, {"id":3, "text":"Bạn"}],
     * "correctOrder": [1, 2, 3],
     * "correctText": "Tôi Yêu Bạn"  // Để hiển thị đáp án đẹp
     * }
     * * 3. TRUE_FALSE (Đúng sai - Bài 3):
     * { "statement": "Phía Nam là 北边", "isTrue": false }
     * * 4. TYPING (Dịch thuật - Bài 1):
     * {
     * "question": "Dịch: Xin chào",
     * "acceptableAnswers": ["Ni hao", "Nǐ hǎo", "你好"] // Mảng các đáp án chấp nhận được
     * }
     */
    content: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Question', questionSchema);
