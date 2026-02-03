const assignmentResource = (ass) => {
  if (!ass) return null;

  return {
    id: ass._id,
    title: ass.title,

    // Làm phẳng thông tin lớp
    className: ass.classId?.name || '',
    classId: ass.classId?._id || ass.classId,

    // Làm phẳng thông tin gói câu hỏi
    pack: ass.questionPackId?.title
      ? {
          id: ass.questionPackId._id,
          title: ass.questionPackId.title,
          thumbnail: ass.questionPackId.thumbnail,
          totalQuestions: ass.questionPackId.totalQuestions,
        }
      : null,

    startTime: ass.startTime,
    dueDate: ass.dueDate,

    // Trạng thái bài làm của User (Quan trọng cho Frontend)
    status: ass.status || 'TODO', // TODO, SUBMITTED, LATE

    // Kết quả làm bài (Nếu có) -> Flatten ra ngoài luôn cho dễ lấy
    myScore: ass.mySubmission ? ass.mySubmission.score : null,
    submittedAt: ass.mySubmission ? ass.mySubmission.submittedAt : null,

    settings: ass.settings,
  };
};

module.exports = assignmentResource;
