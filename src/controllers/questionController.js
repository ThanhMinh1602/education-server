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
const { USER_ROLES } = require('../constants/enums');

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

    return listResponse(res, packs, total, page, limit);
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
    const { packId, type, content, point } = req.body;

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
      content, // JSON linh động
      point: point || 1,
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

// @desc    Xóa câu hỏi
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return errorResponse(res, 'Câu hỏi không tồn tại', 404);

    // Giảm số lượng trong Pack
    await QuestionPack.findByIdAndUpdate(question.packId, {
      $inc: { totalQuestions: -1 },
    });

    await question.deleteOne();

    return successResponse(res, null, 'Đã xóa câu hỏi');
  } catch (error) {
    return errorResponse(res, error);
  }
};
