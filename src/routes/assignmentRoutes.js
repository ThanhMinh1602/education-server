const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
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
 *     responses:
 *       201:
 *         description: Created
 *
 *   get:
 *     summary: Lấy danh sách bài tập (GV xem bài đã giao, HS xem bài cần làm)
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
 *         description: Assignment ID
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
 *                       description: String, Boolean hoặc Array tùy loại câu hỏi
 *     responses:
 *       200:
 *         description: Nộp thành công, trả về điểm số
 */
router.post('/:id/submit', authorize('student'), submitAssignment);

// ======================= SUBMISSION HISTORY =======================

/**
 * @swagger
 * /assignments/{id}/history:
 *   get:
 *     summary: Xem lại kết quả bài đã làm
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
