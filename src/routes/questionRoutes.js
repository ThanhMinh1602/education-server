const express = require('express');
const router = express.Router();
const {
  // Level
  createLevel,
  getLevels,
  updateLevel,
  deleteLevel,
  // Pack
  createPack,
  getPacks,
  updatePack,
  deletePack,
  // Question
  createQuestion,
  getQuestionsByPack,
  updateQuestion,
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

/* ======================= LEVEL ======================= */

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
 *               description:
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

/**
 * @swagger
 * /content/levels/{id}:
 *   put:
 *     summary: Cập nhật thông tin cấp độ
 *     tags: [Content]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               order:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *
 *   delete:
 *     summary: Xóa cấp độ (Chỉ xóa được khi không có gói câu hỏi nào)
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
 *       400:
 *         description: Không thể xóa vì còn dữ liệu liên quan
 */
router
  .route('/levels/:id')
  .put(authorize('teacher', 'admin'), updateLevel)
  .delete(authorize('teacher', 'admin'), deleteLevel);

/* ======================= PACK ======================= */

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
 *       - in: query
 *         name: keyword
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
 *               description:
 *                 type: string
 *               thumbnail:
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

/**
 * @swagger
 * /content/packs/{id}:
 *   put:
 *     summary: Cập nhật gói câu hỏi
 *     tags: [Content]
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
 *               title:
 *                 type: string
 *               levelId:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *
 *   delete:
 *     summary: Xóa gói câu hỏi (Xóa luôn tất cả câu hỏi và ảnh bên trong)
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
 *         description: Xóa thành công toàn bộ dữ liệu gói
 */
router
  .route('/packs/:id')
  .put(authorize('teacher', 'admin'), updatePack)
  .delete(authorize('teacher', 'admin'), deletePack);

/* ======================= QUESTION ======================= */
/**
 * @swagger
 * /content/questions:
 *   post:
 *     summary: Thêm câu hỏi vào gói (Xem Examples để biết cấu trúc từng loại)
 *     description: API này hỗ trợ đa hình (Polymorphism). Vui lòng chọn Example bên dưới để xem cấu trúc JSON cho từng loại câu hỏi.
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [packId, type, content]
 *             properties:
 *               packId:
 *                 type: string
 *                 description: ID của gói câu hỏi
 *               type:
 *                 type: string
 *                 enum: [MULTIPLE_CHOICE, ARRANGE, TRUE_FALSE, TYPING]
 *                 description: Loại câu hỏi quyết định cấu trúc của content
 *               mediaUrl:
 *                 type: string
 *                 description: Link ảnh/audio (Lấy từ API upload)
 *               mediaPublicId:
 *                 type: string
 *                 description: ID ảnh trên Cloudinary (Bắt buộc để sau này xóa được ảnh)
 *               mediaType:
 *                 type: string
 *                 enum: [IMAGE, AUDIO, VIDEO, NONE]
 *                 default: NONE
 *               explanation:
 *                 type: string
 *                 description: Giải thích đáp án (Hiện sau khi nộp bài)
 *               point:
 *                 type: number
 *                 default: 1
 *               content:
 *                 type: object
 *                 description: Cấu trúc JSON thay đổi tùy theo trường type (Xem Examples)
 *           examples:
 *             MultipleChoice_Image:
 *               summary: 1. Trắc nghiệm (Nhìn hình đoán chữ)
 *               value:
 *                 packId: "65d4..."
 *                 type: "MULTIPLE_CHOICE"
 *                 mediaUrl: "https://res.cloudinary.com/.../con_cho.jpg"
 *                 mediaPublicId: "education/con_cho"
 *                 mediaType: "IMAGE"
 *                 point: 1
 *                 explanation: "Con chó trong tiếng Anh là Dog"
 *                 content:
 *                   question: "Đây là con gì?"
 *                   options:
 *                     - id: "A"
 *                       text: "Cat"
 *                       isCorrect: false
 *                     - id: "B"
 *                       text: "Dog"
 *                       isCorrect: true
 *                     - id: "C"
 *                       text: "Bird"
 *                       isCorrect: false
 *                     - id: "D"
 *                       text: "Fish"
 *                       isCorrect: false
 *
 *             Arrange_Sentence:
 *               summary: 2. Sắp xếp câu (Ngữ pháp)
 *               value:
 *                 packId: "65d4..."
 *                 type: "ARRANGE"
 *                 mediaUrl: ""
 *                 mediaPublicId: ""
 *                 mediaType: "NONE"
 *                 point: 2
 *                 explanation: "Cấu trúc: I + love + you"
 *                 content:
 *                   question: "Sắp xếp thành câu có nghĩa"
 *                   segments:
 *                     - id: 1
 *                       text: "You"
 *                     - id: 2
 *                       text: "I"
 *                     - id: 3
 *                       text: "Love"
 *                   correctOrder: [2, 3, 1]
 *                   correctText: "I Love You"
 *
 *             Typing_Audio:
 *               summary: 3. Điền từ (Nghe chép chính tả)
 *               value:
 *                 packId: "65d4..."
 *                 type: "TYPING"
 *                 mediaUrl: "https://res.cloudinary.com/.../hello.mp3"
 *                 mediaPublicId: "education/hello"
 *                 mediaType: "AUDIO"
 *                 point: 3
 *                 explanation: "Người nói đang chào buổi sáng"
 *                 content:
 *                   question: "Nghe và điền từ còn thiếu: 'Good ____'"
 *                   acceptableAnswers: ["morning", "Morning", "MORNING"]
 *
 *             TrueFalse:
 *               summary: 4. Đúng / Sai
 *               value:
 *                 packId: "65d4..."
 *                 type: "TRUE_FALSE"
 *                 mediaType: "NONE"
 *                 point: 1
 *                 content:
 *                   question: "Mặt trời mọc đằng Tây?"
 *                   options:
 *                     - id: "true"
 *                       text: "Đúng"
 *                       isCorrect: false
 *                     - id: "false"
 *                       text: "Sai"
 *                       isCorrect: true
 *     responses:
 *       201:
 *         description: Thêm câu hỏi thành công
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
 *   put:
 *     summary: Cập nhật câu hỏi (Hỗ trợ thay thế ảnh cũ)
 *     tags: [Content]
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
 *               type:
 *                 type: string
 *               content:
 *                 type: object
 *               point:
 *                 type: number
 *               mediaUrl:
 *                 type: string
 *               mediaPublicId:
 *                 type: string
 *               mediaType:
 *                 type: string
 *               explanation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *
 *   delete:
 *     summary: Xóa câu hỏi (Xóa kèm ảnh trên Cloudinary)
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
router
  .route('/questions/:id')
  .put(authorize('teacher', 'admin'), updateQuestion)
  .delete(authorize('teacher', 'admin'), deleteQuestion);

module.exports = router;
