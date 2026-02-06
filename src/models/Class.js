const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Class:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Lớp Flutter K12 - Đà Nẵng"
 *         code:
 *           type: string
 *           example: "FLUT2026"
 *         description:
 *           type: string
 *           example: "Lớp học Flutter cơ bản"
 *         thumbnail:
 *           type: string
 *           example: "https://example.com/thumbnail.png"
 *         teacherId:
 *           type: string
 *           description: ID giáo viên chủ nhiệm
 *         studentIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Danh sách ID học viên
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

const classSchema = new mongoose.Schema(
  {
    // Tên lớp (VD: "Lớp Flutter K12 - Đà Nẵng")
    name: { type: String, required: true, trim: true },

    // Mã code để học viên nhập vào xin vào lớp (VD: "FLUT2026")
    code: { type: String, unique: true, required: true, trim: true },

    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' }, // Ảnh bìa lớp

    // ID Giáo viên chủ nhiệm (Liên kết bảng User)
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    schedule: [
      {
        // Quy ước: 0 = Chủ Nhật, 1 = Thứ 2, ..., 6 = Thứ 7 (Theo chuẩn JS Date)
        dayOfWeek: {
          type: Number,
          required: true,
          min: 0,
          max: 6
        },
        startTime: { type: String, required: true }, // VD: "19:30"
        endTime: { type: String, required: true },   // VD: "21:30"
        room: { type: String, default: 'Online' }    // VD: "Phòng Zoom 1", "Google Meet"
      }
    ],
    // Danh sách ID học viên trong lớp (Liên kết bảng User)
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Class', classSchema);
