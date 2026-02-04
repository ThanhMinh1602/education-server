const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { uploadImage, deleteFile } = require('../controllers/uploadController');
const { protect, authorize } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Upload ảnh, âm thanh lên Cloudinary
 */

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload 1 file (Ảnh hoặc Audio)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Chọn file từ máy tính
 *     responses:
 *       200:
 *         description: Upload thành công
 *       400:
 *         description: Không có file upload
 *       401:
 *         description: Unauthorized
 */

router.post(
  '/', // Path gốc (sẽ thành /api/upload)
  protect,
  // authorize('teacher', 'admin'), // Bỏ comment nếu muốn chặn học viên
  upload.single('file'), // Key gửi lên từ Postman/Flutter phải là 'file'
  uploadImage,
);

/**
 * @swagger
 * /upload:
 *   delete:
 *     summary: Xóa file trên Cloudinary (Dọn rác)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicId
 *             properties:
 *               publicId:
 *                 type: string
 *                 description: ID của file (VD -> education_app/abc...)
 *                 example: "education_app/sample_image"
 *               type:
 *                 type: string
 *                 enum: [image, video]
 *                 default: image
 *                 description: Chọn 'video' nếu xóa file âm thanh mp3
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Thiếu publicId
 */
router.delete(
  '/',
  protect,
  authorize('teacher', 'admin'), // Chỉ GV/Admin mới được xóa
  deleteFile,
);

module.exports = router;
