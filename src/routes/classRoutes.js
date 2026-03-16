const express = require('express');
const router = express.Router();

const {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  joinClass,
  deleteClass,
  removeStudentFromClass,
} = require('../controllers/classController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Tất cả thao tác với lớp đều cần đăng nhập
router.use(protect);

/**
 * @swagger
 * tags:
 *   - name: Classes
 *     description: Quản lý lớp học và thành viên
 */

// ======================= ROOT ROUTES =======================

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Tạo lớp học mới (Chỉ Teacher)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên lớp học
 *               thumbnail:
 *                 type: string
 *                 description: Link ảnh bìa (Cloudinary)
 *               description:
 *                 type: string
 *                 description: Mô tả ngắn về lớp
 *               schedule:
 *                 type: array
 *                 description: Lịch học (VD Thứ 2, 19:00 - 21:00)
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                       description: 0=CN, 1=T2, ..., 6=T7
 *                       example: 1
 *                     startTime:
 *                       type: string
 *                       example: "19:00"
 *                     endTime:
 *                       type: string
 *                       example: "21:00"
 *                     room:
 *                       type: string
 *                       example: "Online"
 *     responses:
 *       201:
 *         description: Tạo thành công, trả về kèm mã Code
 *
 *   get:
 *     summary: Lấy danh sách lớp (GV thấy lớp mình dạy, HS thấy lớp mình học)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang số (Mặc định 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng mỗi trang (Mặc định 10)
 *     responses:
 *       200:
 *         description: Thành công
 */
router
  .route('/')
  .post(authorize('teacher', 'admin'), createClass)
  .get(getClasses);

// ======================= JOIN CLASS =======================

/**
 * @swagger
 * /classes/join:
 *   post:
 *     summary: Học viên tham gia lớp bằng mã Code
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "QW12E4"
 *     responses:
 *       200:
 *         description: Tham gia thành công
 *       404:
 *         description: Mã lớp không đúng
 */
router.post('/join', authorize('student'), joinClass);

// ======================= DETAIL ROUTES =======================

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: Xem chi tiết lớp và danh sách thành viên
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *
 *   put:
 *     summary: Cập nhật thông tin lớp (Tên, Lịch học, Ảnh, Khóa lớp)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên lớp
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 description: true = Mở lớp, false = Khóa lớp
 *               schedule:
 *                 type: array
 *                 description: Cập nhật toàn bộ lịch học
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                       example: 1
 *                     startTime:
 *                       type: string
 *                       example: "19:00"
 *                     endTime:
 *                       type: string
 *                       example: "21:00"
 *                     room:
 *                       type: string
 *                       example: "Phòng 101"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *
 *   delete:
 *     summary: Xóa lớp học (Chỉ Teacher sở hữu)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router
  .route('/:id')
  .get(getClassById)
  .put(authorize('teacher', 'admin'), updateClass)
  .delete(authorize('teacher', 'admin'), deleteClass);

// ======================= MEMBER MANAGEMENT =======================

/**
 * @swagger
 * /classes/{classId}/students/{studentId}:
 *   delete:
 *     summary: Xóa/Mời học viên ra khỏi lớp
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         description: ID của lớp học
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         description: ID của học viên cần xóa
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã xóa học viên thành công
 *       403:
 *         description: Không có quyền thực hiện (Chỉ Teacher/Admin)
 *       404:
 *         description: Không tìm thấy tài nguyên
 */

// Định nghĩa Route dùng DELETE và truyền thẳng 2 ID lên URL
router.delete(
  '/:classId/students/:studentId',
  authorize('teacher', 'admin'),
  removeStudentFromClass
);

module.exports = router;
