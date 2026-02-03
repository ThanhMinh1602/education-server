const levelResource = (level) => {
  if (!level) return null;

  // Đôi khi level là ID (do chưa populate), ta check xem nó có phải object không
  const isObject = typeof level === 'object' && level !== null && level._id;
  if (!isObject) return level; // Trả về ID nếu chưa populate

  return {
    id: level._id,
    name: level.name,
    description: level.description,
    order: level.order,
    isActive: level.isActive,

    createdAt: level.createdAt,
    updatedAt: level.updatedAt,
  };
};

module.exports = levelResource;
