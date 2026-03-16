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
    schedule: Array.isArray(cls.schedule)
      ? cls.schedule.map((item) => ({
        id: item._id, // Map _id của Mongo sang id
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room,
      }))
      : [],
    isActive: cls.isActive,
    // Format ngày tháng nếu cần (hoặc để nguyên ISO String)
    createdAt: cls.createdAt,
    updatedAt: cls.updatedAt,
  };
};
