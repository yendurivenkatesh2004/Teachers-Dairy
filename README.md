# School Syllabus Tracker

A role-based web application for tracking syllabus progress in schools. Teachers mark completed topics, admins manage sections and syllabuses, and headmasters/deputy headmasters view progress analytics.

## System Architecture

### Three User Roles
1. **Admin** - Manages sections, classes, syllabuses, and teacher allocations
2. **Teacher** - Views allocated classes and marks syllabus topics as complete
3. **Headmaster/Deputy Headmaster** - Views overall progress and performance analytics

### Tech Stack
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **Frontend**: React + React Router
- **Auth**: JWT Tokens + bcryptjs

## Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file** (copy from .env.example)
   ```bash
   cp .env.example .env
   ```

4. **Configure .env** with your MongoDB connection and JWT secret
   ```
   MONGODB_URI=mongodb://localhost:27017/school-syllabus-tracker
   JWT_SECRET=your-strong-secret-key-here
   PORT=5000
   NODE_ENV=development
   ```

5. **Start the backend server**
   ```bash
   npm start
   # or with nodemon for auto-restart
   npx nodemon server.js
   ```

Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

Frontend will run on `http://localhost:5173` (or similar)

## Initial Setup Guide

### 1. Create Admin User
The first user should be created as an Admin. Use the Register page to create:
- Name: Admin
- Email: admin@school.com
- Password: (secure password)
- Role: admin

### 2. Admin Dashboard - Setup School Structure

#### Create Sections
1. Go to "Sections" tab
2. Add sections for each class:
   - Class 10 → Section A, B, C
   - Class 9 → Section A, B
   - etc.

#### Create Syllabuses
1. Go to "Syllabuses" tab
2. Create subject-wise syllabuses:
   - **Class 10 - Mathematics**: Add topics like
     - Chapter 1: Real Numbers
     - Chapter 2: Polynomials
     - Chapter 3: Quadratic Equations
     - etc.
   - **Class 10 - Science**: Add science chapters
   - **Class 10 - English**: Add literature/grammar units

#### Register Teachers
1. Use the Register page to create teacher accounts:
   - Name: Teacher Name
   - Email: teacher@school.com
   - Role: teacher

#### Allocate Teachers to Classes
1. Go to "Allocations" tab
2. Select:
   - Teacher name
   - Class (e.g., Class 10)
   - Section (e.g., A)
   - Subject (Mathematics, Science, etc.)
3. Click "Allocate Teacher"

### 3. Teacher Dashboard - Track Progress

1. **Login** with teacher credentials
2. **View Allotted Classes** on the left panel
3. **Select a class** to see syllabus topics
4. **Check off topics** as they're completed
5. Progress automatically syncs to the database

### 4. Headmaster Dashboard - View Analytics

#### Classes View
- See overall progress for each class
- View subject-wise breakdown
- See which teacher is teaching what
- Track completed topics vs total topics

#### Teachers View
- See each teacher's overall performance
- View allocation count
- Track total topics vs completed across all classes

## Database Schema

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['admin', 'teacher', 'headmaster', 'deputy_headmaster'],
  createdAt: Date,
  updatedAt: Date
}
```

### Section
```javascript
{
  name: String,      // A, B, C
  className: String, // Class 10
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Syllabus
```javascript
{
  className: String,
  subject: String,
  section: String,
  topics: [{
    title: String,
    subtopics: [],
    description: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Allocation
```javascript
{
  teacher: ObjectId,     // ref: User
  className: String,
  section: String,
  syllabus: ObjectId,    // ref: Syllabus
  createdAt: Date,
  updatedAt: Date
}
```

### Progress
```javascript
{
  allocation: ObjectId,  // ref: Allocation
  topicTitle: String,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Teacher APIs
- `GET /api/syllabus/teacher/:teacherId` - Get teacher's allocations
- `PATCH /api/syllabus/update-topic` - Mark topic complete/incomplete

### Admin APIs
- `POST /api/admin/sections` - Create section
- `GET /api/admin/sections` - List sections
- `DELETE /api/admin/sections/:id` - Delete section
- `POST /api/admin/syllabuses` - Create/update syllabus
- `GET /api/admin/syllabuses` - List syllabuses
- `DELETE /api/admin/syllabuses/:id` - Delete syllabus
- `POST /api/admin/allocate-teacher` - Allocate teacher
- `DELETE /api/admin/allocate-teacher/:id` - Remove allocation
- `GET /api/admin/teachers` - List all teachers
- `GET /api/admin/allocations` - List all allocations

### Headmaster APIs
- `GET /api/headmaster/classes` - Get classes with progress
- `GET /api/headmaster/class/:className` - Get class details
- `GET /api/headmaster/class/:className/subject/:subject` - Get subject progress
- `GET /api/headmaster/teachers` - Get teachers with performance

## Features

### Teacher Features
✅ View allocated classes and sections
✅ See all topics for each subject
✅ Mark topics as complete (checkbox)
✅ Track personal progress percentage
✅ Real-time sync with server

### Admin Features
✅ Create and delete sections
✅ Create and update syllabuses with topics
✅ Add/remove teacher allocations
✅ View all teachers and allocations
✅ Manage school structure

### Headmaster Features
✅ View overall class progress
✅ See subject-wise breakdown
✅ Track teacher assignments
✅ View teacher performance metrics
✅ See topic completion status

## File Structure
```
backend/
├── models/
│   ├── User.js
│   ├── Section.js
│   ├── Syllabus.js
│   ├── Allocation.js
│   └── Progress.js
├── controllers/
│   ├── authController.js
│   ├── syllabusController.js
│   ├── adminController.js
│   └── headmasterController.js
├── routes/
│   ├── authRoutes.js
│   ├── syllabusRoutes.js
│   ├── adminRoutes.js
│   └── headmasterRoutes.js
├── config/
│   └── db.js
├── server.js
├── package.json
└── .env

frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── TeacherDashboard.jsx
│   │   ├── AdminPanel.jsx
│   │   └── HeadMasterDashboard.jsx
│   ├── components/
│   │   └── SyllabusTracker.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── index.html
```

## Troubleshooting

### Backend Connection Issues
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify PORT isn't already in use

### Authentication Errors
- Ensure JWT_SECRET is set in .env
- Clear browser localStorage and try login again
- Check token expiry (24 hours)

### Data Not Syncing
- Check browser console for errors
- Verify backend is running
- Check network tab in DevTools
- Ensure allocation exists for the class

## Future Enhancements
- Add bulk upload of syllabuses (CSV/Excel)
- Email notifications for progress milestones
- Dashboard charts and visualizations
- Export progress reports (PDF)
- Parent access with read-only view
- Attendance tracking integration
- Performance analytics and predictions

## License
MIT
