const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Level:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Beginner"
 *         description:
 *           type: string
 *           example: "Dành cho người mới bắt đầu"
 *         order:
 *           type: integer
 *           example: 1
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const levelSchema = new mongoose.Schema(
  {
    // Tên cấp độ (VD: "Beginner", "Advanced", "JLPT N5")
    name: { type: String, required: true, unique: true },

    // Mô tả chi tiết
    description: { type: String, default: '' },

    // Thứ tự sắp xếp hiển thị trên App (Số nhỏ hiện trước)
    order: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Level', levelSchema);
