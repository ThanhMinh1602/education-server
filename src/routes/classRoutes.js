const express = require('express');
const router = express.Router();

const {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  joinClass,
  deleteClass,
  removeStudent,
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
 *     summary: Cập nhật thông tin lớp (Tên, Ảnh, Khóa lớp)
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
 * /classes/{id}/remove-student:
 *   put:
 *     summary: Mời học viên ra khỏi lớp (Kick)
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đã xóa học viên
 */
router.put('/:id/remove-student', authorize('teacher', 'admin'), removeStudent);

module.exports = router;
