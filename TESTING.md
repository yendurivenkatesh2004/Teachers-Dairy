# Testing the System

## Manual Test Workflow

### Phase 1: User Registration

#### Create Admin User
```
URL: http://localhost:5173/register
Name: Admin User
Email: admin@school.com
Password: admin123
Role: Administrator
```

#### Create Teacher Users
```
URL: http://localhost:5173/register
1. Name: John Math Teacher
   Email: john.math@school.com
   Password: teacher123
   Role: Teacher

2. Name: Jane Science Teacher
   Email: jane.science@school.com
   Password: teacher456
   Role: Teacher

3. Name: Bob English Teacher
   Email: bob.english@school.com
   Password: teacher789
   Role: Teacher
```

#### Create Headmaster User
```
URL: http://localhost:5173/register
Name: Head Master
Email: hm@school.com
Password: headmaster123
Role: Head Master
```

### Phase 2: Admin Setup

#### Login as Admin
```
Email: admin@school.com
Password: admin123
```

#### Create Sections (Sections Tab)
```
1. Section Name: A, Class Name: Class 10
2. Section Name: B, Class Name: Class 10
3. Section Name: C, Class Name: Class 10
4. Section Name: A, Class Name: Class 9
5. Section Name: B, Class Name: Class 9
```

#### Create Syllabuses (Syllabuses Tab)

**Class 10 - Mathematics**
- Class Name: Class 10
- Subject: Mathematics
- Section: (leave empty for cross-section)
- Topics:
  1. Real Numbers
  2. Polynomials
  3. Pair of Linear Equations
  4. Quadratic Equations
  5. Arithmetic Progressions
  6. Triangles
  7. Coordinate Geometry
  8. Introduction to Trigonometry
  9. Some Applications of Trigonometry
  10. Circles

**Class 10 - Science**
- Topics:
  1. Chemical Reactions and Equations
  2. Acids, Bases and Salts
  3. Metals and Non-metals
  4. Carbon and its Compounds
  5. Periodic Classification of Elements
  6. Life Processes
  7. Control and Coordination
  8. How do Organisms Reproduce
  9. Heredity and Evolution
  10. Light - Reflection and Refraction

**Class 10 - English**
- Topics:
  1. Reading Comprehension
  2. Creative Writing
  3. Grammar Essentials
  4. Literature Analysis
  5. Oral Communication

**Class 9 - Mathematics**
- Topics:
  1. Number Systems
  2. Polynomials
  3. Coordinate Geometry
  4. Linear Equations
  5. Introduction to Euclid's Geometry
  6. Lines and Angles
  7. Triangles
  8. Quadrilaterals
  9. Areas of Parallelograms and Triangles
  10. Circles

#### Allocate Teachers (Allocations Tab)

| Teacher | Class | Section | Subject |
|---------|-------|---------|---------|
| John Math Teacher | Class 10 | A | Mathematics |
| John Math Teacher | Class 10 | B | Mathematics |
| Jane Science Teacher | Class 10 | A | Science |
| Jane Science Teacher | Class 9 | A | Science |
| Bob English Teacher | Class 10 | C | English |

### Phase 3: Teacher Testing

#### Login as John Math Teacher
```
Email: john.math@school.com
Password: teacher123
```

**Expected Results:**
- Left panel shows: Class 10 Section A, Class 10 Section B
- Both show 0% progress

**Test Marking Topics:**
1. Click "Class 10 Section A"
2. In right panel, click checkboxes for topics:
   - ✓ Real Numbers
   - ✓ Polynomials
   - ✓ Pair of Linear Equations
3. Progress should show: 30% (3 of 10)
4. Click another class card to refresh and verify persistence

#### Switch to Jane Science Teacher
```
Logout and login with:
Email: jane.science@school.com
Password: teacher456
```

**Test:**
1. Should see Class 10 Section A (Science) and Class 9 Section A (Science)
2. Mark some topics: 2 of 10 in each class
3. Verify progress updates

### Phase 4: Admin Verification

#### Login as Admin
```
Email: admin@school.com
Password: admin123
```

**Go to Allocations Tab:**
- Verify all teacher allocations are showing correctly
- Test delete functionality on one allocation
- Re-allocate the teacher

### Phase 5: Headmaster Dashboard

#### Login as Headmaster
```
Email: hm@school.com
Password: headmaster123
```

**Classes View:**
- Should see Class 10 and Class 9
- Class 10 should show calculated progress from all subjects
- Click on a class to see detailed breakdown

**Expected Stats for Class 10:**
- Total Subjects: 3 (Math, Science, English)
- Total Topics: 25 (10 + 10 + 5)
- Completed: 8 (3 from Math, 2 from Science, 3 from English)
- Progress: ~32%

**Teachers View:**
- Should show John (2 allocations), Jane (2 allocations), Bob (1 allocation)
- Overall progress for each teacher
- Click to see detailed breakdown

### Phase 6: Stress Testing

#### Add More Teachers
```
Create 5 more teachers with different allocations
```

#### Mark Progress
```
Have each teacher mark 30-70% progress on their allocated classes
```

#### Verify Dashboard
```
Headmaster dashboard should show:
- Aggregate progress for each class
- Real-time updates as teachers update
- Correct statistics
```

## Expected Behavior Checklist

### Teacher Dashboard
- ✅ Shows all allocated classes/sections on left
- ✅ Progress bar shows correct percentage
- ✅ Topics load from syllabus
- ✅ Checkboxes save immediately
- ✅ Progress persists on page refresh
- ✅ Can mark/unmark topics

### Admin Panel
- ✅ Can create sections
- ✅ Can view all sections
- ✅ Can delete sections
- ✅ Can create syllabuses with multiple topics
- ✅ Can view all syllabuses
- ✅ Can delete syllabuses
- ✅ Can allocate teachers
- ✅ Can view all allocations
- ✅ Can remove allocations
- ✅ Can view all teachers

### Headmaster Dashboard
- ✅ Classes tab shows all classes with progress
- ✅ Clicking class shows detailed subject-wise progress
- ✅ Shows teacher names for each subject
- ✅ Shows completed topics count
- ✅ Teachers tab shows teacher performance
- ✅ Shows allocation count per teacher
- ✅ Shows overall progress per teacher

## Common Issues & Solutions

### Issue: "Invalid email or password" on login
**Solution:** Ensure user was created with exactly the same email and password

### Issue: Sections not appearing in dropdown
**Solution:** 
1. Ensure you're logged in as admin
2. Create at least one section first
3. Refresh the page

### Issue: Progress not syncing
**Solution:**
1. Check browser console for errors
2. Verify backend is running (http://localhost:5000)
3. Check that allocation exists
4. Try marking the topic again

### Issue: Headmaster sees no data
**Solution:**
1. Ensure teachers have marked at least one topic
2. Refresh the dashboard
3. Check that allocations were created

## Performance Testing

### Load Testing Scenarios
1. Create 50 sections
2. Create 100 syllabuses
3. Allocate 50 teachers
4. Have 10 teachers mark 100 topics each
5. View headmaster dashboard (should load <2 seconds)

### Expected Performance
- Admin panel load: <1 second
- Teacher dashboard: <500ms
- Headmaster dashboard: <2 seconds
- Topic marking: Instant visual feedback, <500ms sync

## Database Queries for Verification

### Check all users
```
db.users.find()
```

### Check all allocations
```
db.allocations.find().populate('teacher').populate('syllabus')
```

### Check progress for a teacher
```
db.allocations.find({ teacher: ObjectId }).populate('syllabus')
db.progresses.find({ allocation: ObjectId })
```

### Count progress percentage
```
// Total topics * allocation count - count of progress records = pending
```
