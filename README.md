# Education Server

A comprehensive REST API server for an education platform built with Node.js, Express, and MongoDB. This server provides complete functionality for managing users, classes, assignments, questions, and submissions with role-based access control.

## 🚀 Features

- **User Management**: Student, Teacher, and Admin roles with JWT authentication
- **Class Management**: Create and manage classes with enrollment codes
- **Assignment System**: Teachers can create assignments with due dates
- **Question Bank**: Multiple question types (Multiple Choice, True/False, Typing, Arrange)
- **Submission Tracking**: Students can submit assignments with automatic grading
- **Role-Based Access Control**: Different permissions for students, teachers, and admins
- **API Documentation**: Interactive Swagger documentation
- **Security**: JWT tokens with refresh token support

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with refresh tokens
- **Documentation**: Swagger/OpenAPI
- **Security**: bcryptjs for password hashing, CORS enabled
- **Development**: nodemon for hot reloading

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ThanhMinh1602/education-server.git
   cd education-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/education_db
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=3d
   JWT_REFRESH_SECRET=your-refresh-token-secret
   JWT_REFRESH_EXPIRE=7d
   ```

4. **Start the server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000`

## 📚 API Documentation

Once the server is running, visit `http://localhost:3000/api-docs` to access the interactive Swagger documentation.

## 🏗️ Project Structure

```
education-server/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── swagger.js         # Swagger configuration
│   ├── constants/
│   │   └── enums.js           # Application constants and enums
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── classController.js
│   │   ├── assignmentController.js
│   │   ├── questionController.js
│   │   └── submissionController.js
│   ├── middlewares/
│   │   └── authMiddleware.js  # JWT authentication middleware
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Class.js
│   │   ├── Assignment.js
│   │   ├── Question.js
│   │   ├── QuestionPack.js
│   │   ├── Submission.js
│   │   └── Level.js
│   ├── resources/             # Data transformation resources
│   ├── routes/                # API route definitions
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── classRoutes.js
│   │   ├── questionRoutes.js
│   │   └── assignmentRoutes.js
│   └── utils/
│       └── response.js        # Standardized API responses
├── index.js                   # Application entry point
├── package.json
├── .env                       # Environment variables
└── README.md
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication with refresh token support.

### User Roles

- **Student**: Can view classes, submit assignments, view grades
- **Teacher**: Can create/manage classes, create assignments, grade submissions
- **Admin**: Full access to all features

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

#### Users
- `GET /api/users` - Get users (role-based access)
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user (admin/teacher only)
- `PUT /api/users/:id` - Update user

#### Classes
- `GET /api/classes` - Get classes
- `POST /api/classes` - Create class (teacher only)
- `GET /api/classes/:id` - Get class details
- `POST /api/classes/join` - Join class with code
- `DELETE /api/classes/:id` - Delete class (owner/admin only)

#### Assignments
- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Create assignment (teacher only)
- `GET /api/assignments/:id` - Get assignment details

#### Questions/Content
- `GET /api/content/question-packs` - Get question packs
- `POST /api/content/question-packs` - Create question pack (teacher)
- `POST /api/content/questions` - Add question to pack

## 🎯 Question Types

The system supports multiple question types:

1. **MULTIPLE_CHOICE**: Multiple choice questions with options
2. **TRUE_FALSE**: True/False questions
3. **TYPING**: Text input questions with keyword matching
4. **ARRANGE**: Questions requiring arranging items in correct order

## 📊 Database Models

### User
- Personal information (name, email, username)
- Role (student/teacher/admin)
- Classes enrolled
- Authentication data

### Class
- Class information (name, description, code)
- Teacher and student relationships
- Active status

### Assignment
- Assignment details and due dates
- Associated class and question pack
- Teacher assignment

### Question & QuestionPack
- Question content and type
- Question packs with multiple questions
- Difficulty levels

### Submission
- Student submissions for assignments
- Automatic grading for supported question types
- Submission status tracking

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Stateless authentication with access/refresh tokens
- **CORS**: Cross-origin resource sharing enabled
- **Role-Based Access**: Different permissions based on user roles
- **Input Validation**: Request validation and sanitization

## 🚀 Deployment

### Environment Variables for Production
```env
PORT=3000
MONGO_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRE=3d
JWT_REFRESH_SECRET=your-production-refresh-secret
JWT_REFRESH_EXPIRE=7d
```

### Using Docker (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

**Note**: This is an educational project demonstrating full-stack development with modern JavaScript technologies. Make sure to use strong, unique secrets for JWT tokens in production environments.
