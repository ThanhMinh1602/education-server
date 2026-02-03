/**
 * Trả về dữ liệu thành công (Object đơn)
 * @param {Object} res - Express response object
 * @param {any} data - Dữ liệu trả về (User, Class...)
 * @param {string} message - Thông báo (Default: "Thành công")
 * @param {number} statusCode - HTTP status code (Default: 200)
 */
exports.successResponse = (
  res,
  data,
  message = 'Thành công',
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    code: statusCode,
    message,
    data, // Dữ liệu chính nằm ở đây
  });
};

/**
 * Trả về danh sách dữ liệu (Kèm phân trang)
 * @param {Object} res - Express response object
 * @param {Array} data - Mảng dữ liệu
 * @param {number} total - Tổng số lượng bản ghi trong DB
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số lượng bản ghi trên 1 trang
 * @param {string} message - Thông báo
 */
exports.listResponse = (
  res,
  data,
  total,
  page,
  limit,
  message = 'Lấy danh sách thành công',
) => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Number(page) || 1;

  return res.status(200).json({
    success: true,
    code: 200,
    message,
    data, // Mảng dữ liệu
    pagination: {
      page: currentPage,
      limit: Number(limit) || 10,
      totalItems: total,
      totalPages: totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    },
  });
};

/**
 * Trả về lỗi
 * @param {Object} res - Express response object
 * @param {Error|string} error - Lỗi hoặc message lỗi
 * @param {number} statusCode - HTTP status code (Default: 500)
 */
exports.errorResponse = (res, error, statusCode = 500) => {
  // Nếu error là object Error của JS thì lấy message, không thì lấy string trực tiếp
  const message = error.message || error;

  // Log lỗi ra console server để debug (không gửi stack trace cho client vì bảo mật)
  console.error(`❌ Error [${statusCode}]:`, error);

  return res.status(statusCode).json({
    success: false,
    code: statusCode,
    message: message || 'Lỗi hệ thống',
    data: null,
  });
};
