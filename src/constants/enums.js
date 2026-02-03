// src/constants/enums.js

/**
 * Constants cho tất cả enums trong ứng dụng
 * Đảm bảo tính nhất quán và dễ bảo trì
 */

const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  ARRANGE: 'ARRANGE',
  TRUE_FALSE: 'TRUE_FALSE',
  TYPING: 'TYPING',
};

const SUBMISSION_STATUSES = {
  SUBMITTED: 'SUBMITTED',
  LATE: 'LATE',
  GRADED: 'GRADED',
};

const ASSIGNMENT_STATUSES = {
  TODO: 'TODO',
  SUBMITTED: 'SUBMITTED',
  LATE: 'LATE',
  GRADED: 'GRADED',
};

// Export dưới dạng arrays để sử dụng trong validation
const USER_ROLE_VALUES = Object.values(USER_ROLES);
const QUESTION_TYPE_VALUES = Object.values(QUESTION_TYPES);
const SUBMISSION_STATUS_VALUES = Object.values(SUBMISSION_STATUSES);
const ASSIGNMENT_STATUS_VALUES = Object.values(ASSIGNMENT_STATUSES);

module.exports = {
  USER_ROLES,
  QUESTION_TYPES,
  SUBMISSION_STATUSES,
  ASSIGNMENT_STATUSES,
  USER_ROLE_VALUES,
  QUESTION_TYPE_VALUES,
  SUBMISSION_STATUS_VALUES,
  ASSIGNMENT_STATUS_VALUES,
};
