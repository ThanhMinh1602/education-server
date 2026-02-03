const express = require('express');
const router = express.Router();
const {
  createLevel,
  getLevels,
  createPack,
  getPacks,
  createQuestion,
  getQuestionsByPack,
  deleteQuestion,
} = require('../controllers/questionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Quản lý Level, QuestionPack và Question
 */

// ======================= LEVEL =======================

/**
 * @swagger
 * /content/levels:
 *   get:
 *     summary: Lấy danh sách cấp độ
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *
 *   post:
 *     summary: Tạo cấp độ mới
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Created
 */
router
  .route('/levels')
  .get(getLevels)
  .post(authorize('teacher', 'admin'), createLevel);

// ======================= PACK =======================

/**
 * @swagger
 * /content/packs:
 *   get:
 *     summary: Lấy danh sách gói câu hỏi
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: levelId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *
 *   post:
 *     summary: Tạo gói câu hỏi mới
 *     tags: [Content]
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
 *               - levelId
 *             properties:
 *               title:
 *                 type: string
 *               levelId:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Created
 */
router
  .route('/packs')
  .get(getPacks)
  .post(authorize('teacher', 'admin'), createPack);

// ======================= QUESTION =======================

/**
 * @swagger
 * /content/questions:
 *   post:
 *     summary: Thêm câu hỏi vào gói
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packId
 *               - type
 *               - content
 *             properties:
 *               packId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [MULTIPLE_CHOICE, ARRANGE, TRUE_FALSE, TYPING]
 *               content:
 *                 type: object
 *                 description: JSON tuỳ thuộc vào type câu hỏi
 *                 example:
 *                   question: "1 + 1 = ?"
 *                   options:
 *                     - id: 1
 *                       text: "2"
 *                       isCorrect: true
 *                     - id: 2
 *                       text: "3"
 *                       isCorrect: false
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/questions', authorize('teacher', 'admin'), createQuestion);

/**
 * @swagger
 * /content/packs/{packId}/questions:
 *   get:
 *     summary: Lấy tất cả câu hỏi trong 1 gói
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/packs/:packId/questions', getQuestionsByPack);

/**
 * @swagger
 * /content/questions/{id}:
 *   delete:
 *     summary: Xóa câu hỏi
 *     tags: [Content]
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
router.delete('/questions/:id', authorize('teacher', 'admin'), deleteQuestion);

module.exports = router;
