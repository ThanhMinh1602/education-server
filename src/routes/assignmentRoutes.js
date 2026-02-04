const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');
const {
  submitAssignment,
  getSubmissionHistory,
} = require('../controllers/submissionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Assignments
 *   description: Quản lý giao bài và nộp bài
 */

// ======================= ASSIGNMENTS =======================

/**
 * @swagger
 * /assignments:
 *   post:
 *     summary: Giáo viên giao bài tập cho lớp
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - classId
 *               - questionPackId
 *             properties:
 *               title:
 *                 type: string
 *               classId:
 *                 type: string
 *               questionPackId:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               settings:
 *                 type: object
 *                 properties:
 *                   showResultImmediately:
 *                     type: boolean
 *                     default: true
 *                   maxAttempts:
 *                     type: number
 *                     default: 1
 *                   durationMinutes:
 *                     type: number
 *                     default: 45
 *     responses:
 *       201:
 *         description: Giao bài thành công
 *
 *   get:
 *     summary: Lấy danh sách bài tập (GV -> bài đã giao, HS -> bài cần làm)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router
  .route('/')
  .post(authorize('teacher', 'admin'), createAssignment)
  .get(getAssignments);

/**
 * @swagger
 * /assignments/{id}:
 *   get:
 *     summary: Xem chi tiết bài tập
 *     tags: [Assignments]
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
 *     summary: Cập nhật bài tập
 *     tags: [Assignments]
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
 *               title:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *
 *   delete:
 *     summary: Xóa bài tập (Xóa cả bài nộp của HS)
 *     tags: [Assignments]
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
  .get(getAssignmentById)
  .put(authorize('teacher', 'admin'), updateAssignment)
  .delete(authorize('teacher', 'admin'), deleteAssignment);

// ======================= SUBMIT ASSIGNMENT =======================

/**
 * @swagger
 * /assignments/{id}/submit:
 *   post:
 *     summary: Học viên nộp bài tập
 *     tags: [Assignments]
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
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     answer:
 *                       type: object
 *                       description: String | Boolean | Array (tùy loại câu hỏi)
 *     responses:
 *       200:
 *         description: Nộp bài thành công
 */
router.post('/:id/submit', authorize('student'), submitAssignment);

// ======================= SUBMISSION HISTORY =======================

/**
 * @swagger
 * /assignments/{id}/history:
 *   get:
 *     summary: Xem lại lịch sử làm bài
 *     tags: [Assignments]
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
 */
router.get('/:id/history', authorize('student'), getSubmissionHistory);

module.exports = router;
