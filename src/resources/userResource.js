const userResource = (user) => {
  if (!user) return null;

  // Đôi khi user là ID (do chưa populate), ta check xem nó có phải object không
  const isObject = typeof user === 'object' && user !== null && user._id;
  if (!isObject) return user; // Trả về ID nếu chưa populate

  return {
    id: user._id,
    name: user.name,
    username: user.username,
    role: user.role,
    // Nếu không có avatar thì trả về ảnh mặc định hoặc null
    avatar: user.avatar || 'https://via.placeholder.com/150',

    // Nếu có trường avgScore (học viên) thì trả về, không thì thôi
    ...(user.avgScore !== undefined && {
      avgScore: parseFloat(user.avgScore.toFixed(2)),
    }),

    // Nếu có trường subject (giáo viên)
    ...(user.subject && { subject: user.subject }),

    // Flatten classes: Nếu đã populate thì map lấy tên, chưa thì trả ID
    classes: Array.isArray(user.classes)
      ? user.classes.map((c) =>
          c.name ? { id: c._id, name: c.name, code: c.code } : c,
        )
      : [],

    createdAt: user.createdAt,
  };
};

module.exports = userResource;
