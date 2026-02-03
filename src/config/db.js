// File: config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Lấy chuỗi kết nối từ file .env
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    // Thoát chương trình nếu kết nối thất bại
    process.exit(1);
  }
};

module.exports = connectDB;
