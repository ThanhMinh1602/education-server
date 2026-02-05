const Level = require('../models/Level');
const QuestionPack = require('../models/QuestionPack');
const Question = require('../models/Question');
const {
  successResponse,
  errorResponse,
  listResponse,
} = require('../utils/response');
const {
  LevelResource,
  QuestionPackResource,
  QuestionResource,
  collection,
} = require('../resources');
const { removeFileCloudinary } = require('../utils/cloudinaryHelper');
const { USER_ROLES } = require('../constants/enums');
const { MEDIA_TYPE_VALUES } = require('../constants/enums');
const {
  validateQuestion,
  validateQuestionUpdate,
} = require('../validations/questionValidation');

// =========================================================
// PHẦN 1: QUẢN LÝ LEVEL (CẤP ĐỘ)
// =========================================================

// @desc    Tạo cấp độ mới (Admin/Teacher)
exports.createLevel = async (req, res) => {
  try {
    const { name, description, order } = req.body;
    const level = await Level.create({ name, description, order });
    return successResponse(
      res,
      LevelResource(level),
      'Tạo cấp độ thành công',
      201,
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Lấy danh sách cấp độ (Sắp xếp theo order)
exports.getLevels = async (req, res) => {
  try {
    const levels = await Level.find({ isActive: true }).sort({ order: 1 });
    return successResponse(
      res,
      collection(levels, LevelResource),
      'Lấy danh sách cấp độ thành công',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Cập nhật Level (Admin)
exports.updateLevel = async (req, res) => {
  try {
    const { name, description, order, isActive } = req.body;

    const level = await Level.findByIdAndUpdate(
      req.params.id,
      { name, description, order, isActive },
      { new: true, runValidators: true },
    );

    if (!level) return errorResponse(res, 'Cấp độ không tồn tại', 404);

    return successResponse(res, LevelResource(level), 'Cập nhật thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Xóa Level (Admin)
exports.deleteLevel = async (req, res) => {
  try {
    // Kiểm tra xem có Pack nào thuộc Level này không trước khi xóa
    const hasPacks = await QuestionPack.exists({ levelId: req.params.id });
    if (hasPacks) {
      return errorResponse(
        res,
        'Không thể xóa Level này vì đang có bộ câu hỏi đính kèm',
        400,
      );
    }

    const level = await Level.findByIdAndDelete(req.params.id);
    if (!level) return errorResponse(res, 'Cấp độ không tồn tại', 404);

    return successResponse(res, null, 'Xóa cấp độ thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};
// =========================================================
// PHẦN 2: QUẢN LÝ QUESTION PACK (GÓI CÂU HỎI)
// =========================================================

// @desc    Tạo gói câu hỏi mới
exports.createPack = async (req, res) => {
  try {
    const { title, levelId, description, thumbnail, isPublic } = req.body;

    const pack = await QuestionPack.create({
      title,
      levelId,
      description,
      thumbnail,
      isPublic: isPublic || false,
      teacherId: req.user.id,
    });

    return successResponse(
      res,
      QuestionPackResource(pack),
      'Tạo gói câu hỏi thành công',
      201,
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Lấy danh sách gói câu hỏi (Có lọc theo Level hoặc Tìm kiếm)
exports.getPacks = async (req, res) => {
  try {
    const { levelId, keyword } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    // Nếu là Học viên -> Chỉ xem được gói Public hoặc gói của GV mình (Logic này mở rộng sau)
    // Hiện tại tạm để: Ai cũng xem được gói Public, GV xem được gói của mình
    if (req.user.role === USER_ROLES.TEACHER) {
      query = { $or: [{ isPublic: true }, { teacherId: req.user.id }] };
    } else {
      query = { isPublic: true };
    }

    if (levelId) query.levelId = levelId;
    if (keyword) query.title = { $regex: keyword, $options: 'i' };

    const [packs, total] = await Promise.all([
      QuestionPack.find(query)
        .populate('levelId', 'name')
        .populate('teacherId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      QuestionPack.countDocuments(query),
    ]);

    return listResponse(
      res,
      collection(packs, QuestionPackResource),
      total,
      page,
      limit,
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};
// @desc    Cập nhật Gói câu hỏi
exports.updatePack = async (req, res) => {
  try {
    const { title, levelId, description, thumbnail, isPublic } = req.body;

    let pack = await QuestionPack.findById(req.params.id);
    if (!pack) return errorResponse(res, 'Gói câu hỏi không tồn tại', 404);

    // Check quyền: Admin hoặc Chính chủ
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      pack.teacherId.toString() !== req.user.id
    ) {
      return errorResponse(res, 'Bạn không có quyền sửa gói này', 403);
    }

    // Cập nhật
    pack = await QuestionPack.findByIdAndUpdate(
      req.params.id,
      { title, levelId, description, thumbnail, isPublic },
      { new: true },
    );

    return successResponse(
      res,
      QuestionPackResource(pack),
      'Cập nhật thành công',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Xóa Gói câu hỏi (Kèm xóa tất cả câu hỏi và ảnh bên trong)
exports.deletePack = async (req, res) => {
  try {
    const pack = await QuestionPack.findById(req.params.id);
    if (!pack) return errorResponse(res, 'Gói câu hỏi không tồn tại', 404);

    if (
      req.user.role !== USER_ROLES.ADMIN &&
      pack.teacherId.toString() !== req.user.id
    ) {
      return errorResponse(res, 'Bạn không có quyền xóa gói này', 403);
    }

    // 1. Tìm tất cả câu hỏi trong pack này để xóa ảnh trên Cloudinary
    const questions = await Question.find({ packId: pack._id });

    // Dùng vòng lặp để xóa file ảnh (nếu có)
    for (const q of questions) {
      if (q.mediaPublicId) {
        const resourceType =
          q.mediaType === MEDIA_TYPE_VALUES.AUDIO ? 'video' : 'image';
        await removeFileCloudinary(q.mediaPublicId, resourceType);
      }
    }

    // 2. Xóa tất cả câu hỏi trong DB
    await Question.deleteMany({ packId: pack._id });

    // 3. Xóa Pack
    await pack.deleteOne();

    return successResponse(
      res,
      null,
      'Đã xóa gói câu hỏi và toàn bộ dữ liệu liên quan',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};
// =========================================================
// PHẦN 3: QUẢN LÝ QUESTION (CÂU HỎI)
// =========================================================

// @desc    Thêm câu hỏi vào gói
exports.createQuestion = async (req, res) => {
  try {
    const { error } = validateQuestion(req.body);
    if (error) return errorResponse(res, error, 400);
    const {
      packId,
      type,
      content,
      point,
      mediaUrl,
      mediaPublicId,
      mediaType,
      explanation,
    } = req.body;

    // 1. Kiểm tra gói có tồn tại không
    const pack = await QuestionPack.findById(packId);
    if (!pack) return errorResponse(res, 'Gói câu hỏi không tồn tại', 404);

    // 2. Kiểm tra quyền (Chỉ người tạo gói mới được thêm câu hỏi)
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      pack.teacherId.toString() !== req.user.id
    ) {
      return errorResponse(res, 'Bạn không có quyền sửa gói này', 403);
    }

    // 3. Tạo câu hỏi
    const question = await Question.create({
      packId,
      type,
      content,
      point: point || 1,
      mediaUrl: mediaUrl || '',
      mediaPublicId: mediaPublicId || '',
      mediaType: mediaType || MEDIA_TYPE_VALUES.NONE,
      explanation: explanation || '',
    });

    // 4. Cập nhật số lượng câu hỏi trong Pack (Để hiển thị UI cho nhanh)
    pack.totalQuestions += 1;
    await pack.save();

    return successResponse(
      res,
      QuestionResource(question),
      'Thêm câu hỏi thành công',
      201,
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Lấy danh sách câu hỏi của 1 gói (Để làm bài hoặc edit)
exports.getQuestionsByPack = async (req, res) => {
  try {
    const { packId } = req.params;

    const questions = await Question.find({ packId });

    return successResponse(
      res,
      collection(questions, QuestionResource),
      `Lấy thành công ${questions.length} câu hỏi`,
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};
// @desc    Cập nhật câu hỏi (Xử lý thay đổi ảnh)
exports.updateQuestion = async (req, res) => {
  try {
    const { error } = validateQuestionUpdate(req.body, null);
    if (error) return errorResponse(res, error, 400);
    const {
      type,
      content,
      point,
      mediaUrl,
      mediaPublicId,
      mediaType,
      explanation,
    } = req.body;

    let question = await Question.findById(req.params.id);
    if (!question) return errorResponse(res, 'Câu hỏi không tồn tại', 404);

    // Logic xử lý thay đổi ảnh:
    // Nếu Client gửi mediaPublicId MỚI lên, và khác với cái cũ -> Xóa cái cũ đi
    if (
      mediaPublicId &&
      question.mediaPublicId &&
      mediaPublicId !== question.mediaPublicId
    ) {
      const oldType =
        question.mediaType === MEDIA_TYPE_VALUES.AUDIO ? 'video' : 'image';
      await removeFileCloudinary(question.mediaPublicId, oldType);
    }

    // Cập nhật dữ liệu
    question.type = type || question.type;
    question.content = content || question.content;
    question.point = point || question.point;

    // Chỉ update các trường media nếu có gửi lên (để tránh ghi đè thành rỗng nếu không gửi)
    if (mediaUrl !== undefined) question.mediaUrl = mediaUrl;
    if (mediaPublicId !== undefined) question.mediaPublicId = mediaPublicId;
    if (mediaType !== undefined) question.mediaType = mediaType;
    if (explanation !== undefined) question.explanation = explanation;

    await question.save();

    return successResponse(
      res,
      QuestionResource(question),
      'Cập nhật câu hỏi thành công',
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Xóa câu hỏi (Code mới: Kèm xóa ảnh Cloudinary)
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return errorResponse(res, 'Câu hỏi không tồn tại', 404);

    // 1. Xóa ảnh trên Cloudinary nếu có
    if (question.mediaPublicId) {
      const resourceType =
        question.mediaType === MEDIA_TYPE_VALUES.AUDIO ? 'video' : 'image';
      await removeFileCloudinary(question.mediaPublicId, resourceType);
    }

    // 2. Giảm số lượng trong Pack
    await QuestionPack.findByIdAndUpdate(question.packId, {
      $inc: { totalQuestions: -1 },
    });

    // 3. Xóa trong DB
    await question.deleteOne();

    return successResponse(res, null, 'Đã xóa câu hỏi');
  } catch (error) {
    return errorResponse(res, error);
  }
};
