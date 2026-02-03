// File: index.js
require('dotenv').config(); // Load biến môi trường đầu tiên
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const classRoutes = require('./src/routes/classRoutes');
const questionRoutes = require('./src/routes/questionRoutes');
const assignmentRoutes = require('./src/routes/assignmentRoutes');

const app = express();

// --- KẾT NỐI DB Ở ĐÂY ---
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log('📄 Swagger Docs available at http://localhost:3000/api-docs');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/content', questionRoutes);
app.use('/api/assignments', assignmentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
