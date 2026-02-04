const express = require('express');
const router = express.Router();
const {
  getStudents,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getMe,
  changePassword,
  getStudentProgress,
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Áp dụng bảo vệ cho tất cả các route bên dưới
router.use(protect);
router.use(authorize('teacher', 'admin', 'student'));
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Quản lý người dùng và Profile cá nhân
 */

/**
 * @swagger
 * /users/profile/me:
 *   get:
 *     summary: Lấy thông tin cá nhân (Profile của user đang login)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 */
router.get('/profile/me', getMe);

/**
 * @swagger
 * /users/profile/change-password:
 *   put:
 *     summary: Đổi mật khẩu cá nhân
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "newPass123"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu cũ không đúng
 */
router.put('/profile/change-password', changePassword);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy danh sách học viên (Có tìm kiếm & phân trang)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Tìm theo tên hoặc username
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang (mặc định 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số bản ghi/trang (mặc định 10)
 *     responses:
 *       200:
 *         description: Thành công
 *
 *   post:
 *     summary: Tạo tài khoản học viên mới
 *     tags: [Users]
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
 *               - username
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router
  .route('/')
  .get(authorize('teacher', 'admin'), getStudents)
  .post(authorize('teacher', 'admin'), createUser);

/**
 * @swagger
 * /users/{id}/progress:
 *   get:
 *     summary: Xem thống kê học tập của học viên
 *     tags: [Users]
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
 *         description: Lấy thống kê thành công
 */
router.get('/:id/progress', authorize('teacher', 'admin'), getStudentProgress);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Xem chi tiết học viên
 *     tags: [Users]
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
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy user
 *
 *   put:
 *     summary: Cập nhật thông tin học viên
 *     tags: [Users]
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
 *               isActive:
 *                 type: boolean
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *
 *   delete:
 *     summary: Xóa học viên
 *     tags: [Users]
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
  .get(authorize('teacher', 'admin'), getUserById)
  .put(authorize('teacher', 'admin'), updateUser)
  .delete(authorize('teacher', 'admin'), deleteUser);

module.exports = router;
