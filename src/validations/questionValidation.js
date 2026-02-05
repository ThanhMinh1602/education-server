const Joi = require('joi');
const {
  QUESTION_TYPE_VALUES,
  MEDIA_TYPE_VALUES,
  MEDIA_TYPES, // Chỉ dùng cho IMAGE/AUDIO/VIDEO
  QUESTION_TYPES, // Nếu bạn có export object này (Map giữa key và value)
} = require('../constants/enums');

// ============================================================
// 1. CÁC SCHEMA CON (CONTENT THEO TỪNG LOẠI)
// ============================================================

// A. Schema cho Trắc nghiệm & Đúng/Sai (Cấu trúc giống nhau)
const multipleChoiceContentSchema = Joi.object({
  question: Joi.string().required().messages({
    'any.required': 'Nội dung câu hỏi là bắt buộc',
  }),
  options: Joi.array()
    .items(
      Joi.object({
        id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
        text: Joi.string().required(),
        isCorrect: Joi.boolean().required(),
      }),
    )
    .min(2)
    .required()
    .messages({
      'array.min': 'Phải có ít nhất 2 lựa chọn đáp án',
    }),
});

// B. Schema cho Sắp xếp câu (ARRANGE)
const arrangeContentSchema = Joi.object({
  question: Joi.string().required(),
  segments: Joi.array()
    .items(
      Joi.object({
        id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
        text: Joi.string().required(),
      }),
    )
    .min(2)
    .required(),
  // correctOrder phải là mảng các ID (khớp với id trong segments)
  correctOrder: Joi.array()
    .items(Joi.alternatives().try(Joi.string(), Joi.number()))
    .required(),
  correctText: Joi.string().required(), // Câu hoàn chỉnh đúng
});

// C. Schema cho Điền từ/Gõ phím (TYPING)
const typingContentSchema = Joi.object({
  question: Joi.string().required(),
  // Mảng các đáp án chấp nhận được (VD: ["Hello", "hello"])
  acceptableAnswers: Joi.array().items(Joi.string()).min(1).required(),
});

// --- HELPER: Lấy Schema dựa trên Type (Đã bổ sung hàm bị thiếu) ---
const getContentSchema = (type) => {
  // Lưu ý: Dùng string trực tiếp để khớp với giá trị trong DB
  switch (type) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
    case QUESTION_TYPES.TRUE_FALSE:
      return multipleChoiceContentSchema;
    case QUESTION_TYPES.ARRANGE:
      return arrangeContentSchema;
    case QUESTION_TYPES.TYPING:
      return typingContentSchema;
    default:
      return null;
  }
};

// ============================================================
// 2. HÀM VALIDATE CHÍNH (CREATE)
// ============================================================

const validateQuestion = (data) => {
  // A. Validate các trường chung bên ngoài
  const commonSchema = Joi.object({
    packId: Joi.string().required(),
    type: Joi.string()
      .valid(...QUESTION_TYPE_VALUES) // Spread mảng giá trị hợp lệ
      .required(),
    point: Joi.number().min(0).default(1),

    mediaUrl: Joi.string().allow('').optional(),
    mediaPublicId: Joi.string().allow('').optional(),
    mediaType: Joi.string()
      .valid(...MEDIA_TYPE_VALUES) // IMAGE, AUDIO, VIDEO, NONE
      .default(MEDIA_TYPES.NONE),
    explanation: Joi.string().allow('').optional(),

    content: Joi.object().required(),
  }).unknown(true);

  // Validate lớp vỏ ngoài
  const { error: commonError, value } = commonSchema.validate(data);
  if (commonError) {
    return { error: commonError.details[0].message };
  }

  // B. Validate chi tiết Content dựa theo Type
  // FIX LỖI: Dùng hàm helper getContentSchema thay vì switch case lặp lại
  // và sửa lỗi dùng nhầm MEDIA_TYPES cho Question Type

  const contentSchema = getContentSchema(value.type);

  if (contentSchema) {
    const contentCheck = contentSchema.validate(value.content);
    // Nếu content sai cấu trúc
    if (contentCheck.error) {
      return {
        error: `Lỗi nội dung câu hỏi (${value.type}): ${contentCheck.error.details[0].message}`,
      };
    }
  } else {
    // Trường hợp type không nằm trong danh sách hỗ trợ (dù đã valid ở commonSchema nhưng cẩn thận vẫn hơn)
    return { error: 'Loại câu hỏi chưa được hỗ trợ validate nội dung' };
  }

  return { value };
};

// ============================================================
// 3. VALIDATE KHI CẬP NHẬT (UPDATE)
// ============================================================
/**
 * @param {Object} data - Dữ liệu gửi lên từ Body
 * @param {String} currentType - (Bắt buộc) Loại câu hỏi hiện tại trong DB
 */
const validateQuestionUpdate = (data, currentType) => {
  // 1. Validate các trường cơ bản
  const basicSchema = Joi.object({
    type: Joi.string()
      .valid(...QUESTION_TYPE_VALUES)
      .optional(),
    content: Joi.object().optional(),
    point: Joi.number().min(0).optional(),
    mediaUrl: Joi.string().allow('').optional(),
    mediaPublicId: Joi.string().allow('').optional(),
    mediaType: Joi.string()
      .valid(...MEDIA_TYPE_VALUES)
      .optional(),
    explanation: Joi.string().allow('').optional(),
  }).unknown(true);

  const { error } = basicSchema.validate(data);
  if (error) return { error: error.details[0].message };

  // 2. Xác định Type sẽ dùng để validate Content
  const targetType = data.type || currentType;

  // 3. Logic ràng buộc Type và Content

  // TRƯỜNG HỢP A: Có thay đổi Type
  if (data.type && data.type !== currentType) {
    // Bắt buộc phải gửi kèm Content mới
    if (!data.content) {
      return {
        error:
          'Khi thay đổi loại câu hỏi (Type), bắt buộc phải gửi nội dung (Content) mới.',
      };
    }
  }

  // TRƯỜNG HỢP B: Có gửi Content (Dù đổi type hay không)
  if (data.content) {
    // FIX LỖI: Hàm này giờ đã tồn tại
    const contentSchema = getContentSchema(targetType);

    if (contentSchema) {
      const contentCheck = contentSchema.validate(data.content);
      if (contentCheck.error) {
        return {
          error: `Lỗi nội dung (${targetType}): ${contentCheck.error.details[0].message}`,
        };
      }
    }
  }

  return { value: data };
};

module.exports = { validateQuestion, validateQuestionUpdate };
