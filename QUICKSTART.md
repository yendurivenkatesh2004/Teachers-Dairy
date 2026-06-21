# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Start Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env if needed (MongoDB URI, JWT secret)
npm start
# Server runs on http://localhost:5000
```

### Step 2: Start Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### Step 3: Create Admin Account
1. Go to Register page
2. Enter:
   - **Name**: Admin
   - **Email**: admin@school.com
   - **Password**: admin123 (or any secure password)
3. Click Register
4. Go to Login and login with admin@school.com

### Step 4: Setup School (as Admin)
**Sections Tab:**
- Create "Class 10" with sections A, B, C
- Create "Class 9" with sections A, B

**Syllabuses Tab:**
- Create "Class 10 - Mathematics" with topics:
  - Polynomial
  - Quadratic Equations
  - Arithmetic Progression
- Create "Class 10 - Science" with topics:
  - Chemical Reactions
  - Electricity
  - Light & Reflection

**Teachers Tab:**
- Note teacher emails (for registration)

**Register Teachers:**
1. Go to Register page
2. Create teacher accounts:
   - Name: John Teacher, Email: john@school.com
   - Name: Jane Teacher, Email: jane@school.com
3. Login as admin after

**Allocations Tab:**
1. Select "John Teacher" → "Class 10" → "A" → "Class 10 - Mathematics"
2. Click "Allocate Teacher"
3. Do the same for other teachers/subjects

### Step 5: Test as Teacher
1. Logout from admin
2. Go to Login
3. Login as teacher (john@school.com)
4. See allocated classes on left
5. Click a class to see topics
6. Check off topics as complete ✓

### Step 6: View as Headmaster
1. Logout
2. Create headmaster account:
   - Name: Head Master, Email: hm@school.com, Role: headmaster
3. Login as headmaster
4. See overall progress and analytics

## 📊 Test Scenario

**Setup:**
- Admin creates Class 10 with Math/Science syllabuses
- Allocates Math to John, Science to Jane
- John marks 2/3 topics complete
- Jane marks 1/3 complete

**Expected Results:**
- **Teacher View**: John sees his 2 classes, each shows progress
- **Admin View**: Sees all allocations and can manage them
- **Headmaster View**: 
  - Class 10 shows 50% overall progress (3 of 6 topics)
  - Math shows John at 67%
  - Science shows Jane at 33%

## 🔧 Common Tasks

### Add New Class
Admin → Sections → Create Section

### Add New Subject Syllabus
Admin → Syllabuses → Create new with topics

### Assign Teacher to Class
Admin → Allocations → Select teacher/class/subject

### View Class Progress
Headmaster → Classes → Click class name

### Export/Debug Data
Backend console shows all DB operations in development mode

## 📝 Data Model Summary
- **Users**: Admin, Teachers, Headmasters
- **Sections**: Class 10 Section A, B, etc.
- **Syllabuses**: Subject topics for each class
- **Allocations**: Teacher → Class mapping
- **Progress**: Which topics teacher completed

## ✅ You're Done!
The system is now ready to track syllabus progress. Each teacher can mark topics, and headmasters can view real-time progress dashboards.
