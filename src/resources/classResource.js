const userResource = require('./userResource');

module.exports = (cls) => {
  // Guard clause: Nếu input null/undefined thì trả về null
  if (!cls) return null;

  return {
    id: cls._id,
    name: cls.name,
    code: cls.code,
    description: cls.description || '',
    thumbnail: cls.thumbnail || '',

    // --- XỬ LÝ TEACHER (Quan trọng) ---
    // Logic: Nếu controller có .populate('teacherId') thì trả về Object đầy đủ.
    // Nếu không populate (chỉ có ID string), ta trả về object chỉ chứa _id hoặc null
    // (Tránh trường hợp lúc trả về String, lúc trả về Object làm Flutter crash)
    teacher:
      cls.teacherId && cls.teacherId.name
        ? userResource(cls.teacherId)
        : cls.teacherId
          ? { id: cls.teacherId }
          : null,

    // --- SỐ LƯỢNG HỌC VIÊN ---
    studentCount: Array.isArray(cls.studentIds) ? cls.studentIds.length : 0,

    // --- DANH SÁCH HỌC VIÊN ---
    // Chỉ trả về mảng user đầy đủ nếu controller có .populate('studentIds')
    // Nếu không, trả về mảng rỗng [] để tiết kiệm băng thông cho API list
    students:
      Array.isArray(cls.studentIds) &&
      cls.studentIds.length > 0 &&
      cls.studentIds[0].name
        ? cls.studentIds.map((student) => userResource(student))
        : [],

    isActive: cls.isActive,

    // Format ngày tháng nếu cần (hoặc để nguyên ISO String)
    createdAt: cls.createdAt,
    updatedAt: cls.updatedAt,
  };
};
