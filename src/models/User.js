const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Nguyễn Thanh Minh"
 *         username:
 *           type: string
 *           example: "minhnt"
 *         role:
 *           type: string
 *           enum:
 *             - student
 *             - teacher
 *             - admin
 *           example: student
 *         avatar:
 *           type: string
 *           example: "https://example.com/avatar.png"
 *         classes:
 *           type: array
 *           description: Danh sách ID các lớp học viên tham gia
 *           items:
 *             type: string
 *         avgScore:
 *           type: number
 *           example: 8.2
 *         subject:
 *           type: string
 *           example: "Lập trình Flutter"
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

const userSchema = new mongoose.Schema(
  {
    // Họ và tên hiển thị (VD: Nguyễn Thanh Minh)
    name: { type: String, required: true, trim: true },

    // Tên đăng nhập (duy nhất, viết thường)
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Mật khẩu (sẽ được mã hóa - hash trước khi lưu)
    password: { type: String, required: true },

    // Phân quyền: Học viên, Giáo viên, hoặc Quản trị viên
    role: {
      type: String,
      enum: ['student', 'admin', 'teacher'],
      default: 'student',
    },

    // Link ảnh đại diện
    avatar: { type: String, default: '' },

    // Các lớp đang tham gia
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],

    // Điểm trung bình
    avgScore: { type: Number, default: 0.0 },

    // Môn dạy chính (GV)
    subject: { type: String, default: '' },

    // Refresh token
    refreshToken: { type: String, default: null },

    // Trạng thái hoạt động
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Ẩn thông tin nhạy cảm khi trả về client
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.__v;
  obj.id = obj._id;
  delete obj._id;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
