const userResource = require('./userResource'); // Tái sử dụng để format Teacher

const classResource = (cls) => {
  if (!cls) return null;

  return {
    id: cls._id,
    name: cls.name,
    code: cls.code,
    description: cls.description || '',
    thumbnail: cls.thumbnail || '',

    // Thông tin giáo viên (Dùng lại userResource để chuẩn format)
    teacher:
      cls.teacherId && cls.teacherId.name
        ? userResource(cls.teacherId)
        : cls.teacherId,

    // Đếm số lượng học viên (nếu có mảng studentIds)
    studentCount: Array.isArray(cls.studentIds) ? cls.studentIds.length : 0,

    // Nếu cần danh sách học viên chi tiết (cho màn hình Detail)
    students:
      Array.isArray(cls.studentIds) && cls.studentIds[0]?.name
        ? cls.studentIds.map((s) => userResource(s))
        : [],

    isActive: cls.isActive,
    createdAt: cls.createdAt,
  };
};

module.exports = classResource;
