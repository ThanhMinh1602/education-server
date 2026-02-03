// resources/index.js

/**
 * Hàm này giúp áp dụng Resource cho một mảng dữ liệu
 * @param {Array} array - Mảng data từ Mongoose
 * @param {Function} resourceFunc - Hàm Resource đơn lẻ (VD: UserResource)
 */
exports.collection = (array, resourceFunc) => {
  if (!array) return [];
  // Nếu là một mảng thì map, nếu là object đơn lẻ thì chạy hàm trực tiếp
  if (Array.isArray(array)) {
    return array.map((item) => resourceFunc(item));
  }
  return resourceFunc(array);
};

// Export tất cả resources để dễ import
exports.UserResource = require('./userResource');
exports.ClassResource = require('./classResource');
exports.AssignmentResource = require('./assignmentResource');
exports.QuestionResource = require('./questionResource');
exports.SubmissionResource = require('./submissionResource');
exports.QuestionPackResource = require('./questionPackResource');
exports.LevelResource = require('./levelResource');
