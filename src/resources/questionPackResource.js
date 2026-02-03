const userResource = require('./userResource');

const questionPackResource = (pack) => {
  if (!pack) return null;

  // Đôi khi pack là ID (do chưa populate), ta check xem nó có phải object không
  const isObject = typeof pack === 'object' && pack !== null && pack._id;
  if (!isObject) return pack; // Trả về ID nếu chưa populate

  return {
    id: pack._id,
    title: pack.title,
    description: pack.description,
    thumbnail: pack.thumbnail || '',

    // Thông tin cấp độ
    levelId: pack.levelId,
    levelName: pack.levelId?.name || '',

    // Thông tin giáo viên tạo (format bằng userResource)
    teacher: pack.teacherId?.name
      ? userResource(pack.teacherId)
      : pack.teacherId,

    totalQuestions: pack.totalQuestions,
    isPublic: pack.isPublic,

    createdAt: pack.createdAt,
    updatedAt: pack.updatedAt,
  };
};

module.exports = questionPackResource;
