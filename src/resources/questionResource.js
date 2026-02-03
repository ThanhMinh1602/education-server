const questionResource = (question) => {
  if (!question) return null;

  // Đôi khi question là ID (do chưa populate), ta check xem nó có phải object không
  const isObject =
    typeof question === 'object' && question !== null && question._id;
  if (!isObject) return question; // Trả về ID nếu chưa populate

  return {
    id: question._id,
    packId: question.packId,
    type: question.type,
    point: question.point,

    // Nội dung câu hỏi (giữ nguyên structure JSON linh động)
    content: question.content,

    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
};

module.exports = questionResource;
