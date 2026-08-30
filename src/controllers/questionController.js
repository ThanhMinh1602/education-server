const Level = require('../models/Level');
const QuestionPack = require('../models/QuestionPack');
const Question = require('../models/Question');
const {
  successResponse,
  errorResponse,
  listResponse,
} = require('../utils/response');

// --- HELPER: Ẩn đáp án khi trả về cho học viên ---
const stripAnswerFromQuestion = (question) => {
  const q = question.toObject ? question.toObject() : { ...question };
  if (!q.content) return q;

  const content = { ...q.content };

  if (q.type === 'MULTIPLE_CHOICE' && content.options) {
    content.options = content.options.map(({ id, text }) => ({ id, text }));
  } else if (q.type === 'TRUE_FALSE') {
    delete content.isTrue;
    if (content.options) {
      content.options = content.options.map(({ id, text }) => ({ id, text }));
    }
  } else if (q.type === 'TYPING') {
    delete content.keywords;
    delete content.acceptableAnswers;
  } else if (q.type === 'ARRANGE') {
    delete content.correctOrder;
    delete content.correctText;
  }

  return { ...q, content };
};

// =========================================================
// PHẦN 1: QUẢN LÝ LEVEL (CẤP ĐỘ)
// =========================================================

// @desc    Tạo cấp độ mới (Admin/Teacher)
exports.createLevel = async (req, res) => {
  try {
    const { name, description, order } = req.body;
    const level = await Level.create({ name, description, order });
    return successResponse(res, level, 'Tạo cấp độ thành công', 201);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Lấy danh sách cấp độ (Sắp xếp theo order)
exports.getLevels = async (req, res) => {
  try {
    const levels = await Level.find({ isActive: true }).sort({ order: 1 });
    return successResponse(res, levels, 'Lấy danh sách cấp độ thành công');
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

    return successResponse(res, pack, 'Tạo gói câu hỏi thành công', 201);
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

    if (req.user.role === 'teacher') {
      query = { $or: [{ isPublic: true }, { teacherId: req.user.id }] };
    } else if (req.user.role === 'student') {
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

    return listResponse(res, packs, total, page, limit);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Xóa gói câu hỏi (kèm toàn bộ câu hỏi trong gói)
exports.deletePack = async (req, res) => {
  try {
    const pack = await QuestionPack.findById(req.params.id);
    if (!pack) return errorResponse(res, 'Gói câu hỏi không tồn tại', 404);

    if (
      req.user.role !== 'admin' &&
      pack.teacherId.toString() !== req.user.id
    ) {
      return errorResponse(res, 'Bạn không có quyền xóa gói này', 403);
    }

    await Question.deleteMany({ packId: pack._id });
    await pack.deleteOne();

    return successResponse(res, null, 'Đã xóa gói câu hỏi');
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
    const { packId, type, content, point, explanation, mediaUrl, mediaType } = req.body;

    // 1. Kiểm tra gói có tồn tại không
    const pack = await QuestionPack.findById(packId);
    if (!pack) return errorResponse(res, 'Gói câu hỏi không tồn tại', 404);

    // 2. Kiểm tra quyền (Chỉ người tạo gói mới được thêm câu hỏi)
    if (
      req.user.role !== 'admin' &&
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
      explanation: explanation || '',
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || 'NONE',
    });

    // 4. Cập nhật số lượng câu hỏi trong Pack (Để hiển thị UI cho nhanh)
    pack.totalQuestions += 1;
    await pack.save();

    return successResponse(res, question, 'Thêm câu hỏi thành công', 201);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Lấy danh sách câu hỏi của 1 gói (Để làm bài hoặc edit)
exports.getQuestionsByPack = async (req, res) => {
  try {
    const { packId } = req.params;

    const pack = await QuestionPack.findById(packId);
    if (!pack) return errorResponse(res, 'Gói câu hỏi không tồn tại', 404);

    const questions = await Question.find({ packId });

    const isOwner =
      req.user.role === 'admin' ||
      pack.teacherId.toString() === req.user.id;

    const data = isOwner
      ? questions
      : questions.map(stripAnswerFromQuestion);

    return successResponse(
      res,
      data,
      `Lấy thành công ${data.length} câu hỏi`,
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Cập nhật câu hỏi (không đổi loại)
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return errorResponse(res, 'Câu hỏi không tồn tại', 404);

    const pack = await QuestionPack.findById(question.packId);
    if (
      req.user.role !== 'admin' &&
      pack.teacherId.toString() !== req.user.id
    ) {
      return errorResponse(res, 'Bạn không có quyền sửa câu hỏi này', 403);
    }

    const { content, point, explanation, mediaUrl, mediaType } = req.body;
    if (content !== undefined) question.content = content;
    if (point !== undefined) question.point = point;
    if (explanation !== undefined) question.explanation = explanation;
    if (mediaUrl !== undefined) question.mediaUrl = mediaUrl;
    if (mediaType !== undefined) question.mediaType = mediaType;

    await question.save();
    return successResponse(res, question, 'Cập nhật câu hỏi thành công');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// @desc    Xóa câu hỏi
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return errorResponse(res, 'Câu hỏi không tồn tại', 404);

    const pack = await QuestionPack.findById(question.packId);
    if (
      req.user.role !== 'admin' &&
      pack.teacherId.toString() !== req.user.id
    ) {
      return errorResponse(res, 'Bạn không có quyền xóa câu hỏi này', 403);
    }

    await QuestionPack.findByIdAndUpdate(question.packId, {
      $inc: { totalQuestions: -1 },
    });

    await question.deleteOne();

    return successResponse(res, null, 'Đã xóa câu hỏi');
  } catch (error) {
    return errorResponse(res, error);
  }
};
