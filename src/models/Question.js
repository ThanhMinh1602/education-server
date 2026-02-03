const mongoose = require('mongoose');
const { QUESTION_TYPES, QUESTION_TYPE_VALUES } = require('../constants/enums');

/**
 * @swagger
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       properties:
 *         packId:
 *           type: string
 *           description: ID gói câu hỏi
 *         type:
 *           type: string
 *           enum:
 *             - MULTIPLE_CHOICE
 *             - ARRANGE
 *             - TRUE_FALSE
 *             - TYPING
 *           example: MULTIPLE_CHOICE
 *         point:
 *           type: number
 *           example: 1
 *         content:
 *           type: object
 *           description: |
 *             Nội dung câu hỏi (JSON linh động theo từng loại)
 *
 *             MULTIPLE_CHOICE:
 *             {
 *               "question": "1 + 1 = ?",
 *               "options": [
 *                 { "id": "A", "text": "2", "isCorrect": true },
 *                 { "id": "B", "text": "3", "isCorrect": false }
 *               ]
 *             }
 *
 *             ARRANGE:
 *             {
 *               "segments": ["I", "Love", "You"],
 *               "correctOrder": [0, 1, 2]
 *             }
 *
 *             TRUE_FALSE:
 *             {
 *               "statement": "Trái đất hình vuông",
 *               "isTrue": false
 *             }
 *
 *             TYPING:
 *             {
 *               "question": "Điền từ...",
 *               "keywords": ["answer1", "answer2"]
 *             }
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const questionSchema = new mongoose.Schema(
  {
    // Thuộc gói câu hỏi nào?
    packId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionPack',
      required: true,
    },

    // Loại câu hỏi (4 loại như yêu cầu)
    type: {
      type: String,
      enum: QUESTION_TYPE_VALUES,
      required: true,
    },

    // Điểm số cho câu này (Mặc định 1 điểm)
    point: { type: Number, default: 1 },

    // Nội dung câu hỏi (JSON linh động)
    content: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Question', questionSchema);
