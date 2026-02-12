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
  getAssignmentSubmissions,
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

// ======================= SUBMIT ASSIGNMENT =======================

/**
 * @swagger
 * /assignments/{id}/submit:
 *   post:
 *     summary: Học viên nộp bài tập
 *     description: |
 *       API nhận danh sách câu trả lời.
 *       Cấu trúc của field `answer` sẽ thay đổi tùy theo loại câu hỏi.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của bài tập (Assignment ID)
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: array
 *                 description: Danh sách câu trả lời
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - answer
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       description: ID của câu hỏi
 *                     answer:
 *                       type: object
 *                       description: Dữ liệu trả lời (Xem Examples bên dưới)
 *           examples:
 *             Full_Submission_Demo:
 *               summary: Ví dụ nộp bài tổng hợp (Đủ các loại câu hỏi)
 *               value:
 *                 answers:
 *                   - questionId: "65d4... (ID câu Trắc nghiệm)"
 *                     answer:
 *                       selectedOptionId: "B"
 *                   - questionId: "65d4... (ID câu Đúng/Sai)"
 *                     answer:
 *                       selectedOptionId: "false"
 *                   - questionId: "65d4... (ID câu Sắp xếp)"
 *                     answer:
 *                       orderedIds: [2, 3, 1, 4]
 *                   - questionId: "65d4... (ID câu Điền từ)"
 *                     answer:
 *                       text: "Good morning"
 *
 *     responses:
 *       200:
 *         description: Nộp bài thành công – Trả về kết quả chấm điểm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: number
 *                       example: 8.5
 *                     totalCorrect:
 *                       type: number
 *                       example: 3
 *                     totalQuestions:
 *                       type: number
 *                       example: 4
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
router.get('/:id/history', authorize('student', 'teacher', 'admin'), getSubmissionHistory);

// ======================= TEACHER GRADING =======================

/**
 * @swagger
 * /assignments/{id}/submissions:
 *   get:
 *     summary: Xem danh sách nộp bài của cả lớp (Dành cho GV/Admin)
 *     description: |
 *       Trả về danh sách tất cả học sinh trong lớp
 *       kèm trạng thái nộp bài và điểm số (nếu đã chấm).
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của bài tập
 *     responses:
 *       200:
 *         description: Lấy danh sách nộp bài thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       studentId:
 *                         type: string
 *                         example: "65d4..."
 *                       studentName:
 *                         type: string
 *                         example: "Nguyễn Văn A"
 *                       submitted:
 *                         type: boolean
 *                         example: true
 *                       score:
 *                         type: number
 *                         nullable: true
 *                         example: 8.5
 *                       submittedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 */
router.get(
  '/:id/submissions',
  authorize('teacher', 'admin'),
  getAssignmentSubmissions,
);

module.exports = router;
