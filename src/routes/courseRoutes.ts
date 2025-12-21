import express from 'express';
import { 
  createCourse, 
  addChapter, 
  getMyCourses, 
  assignStudentToCourse, 
  getStudentAssignedCourses, 
  getCourseWithChapters,
  updateCourse,
  deleteCourse
} from '../controllers/courseController';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware';

const router = express.Router();

// ==========================================
// 🛡️ SHARED / PUBLIC ROUTES
// ==========================================

// Get a specific course (Auth required to check enrollment)
router.get('/:courseId', authenticateUser, getCourseWithChapters);


// ==========================================
// 🎓 STUDENT ROUTES
// ==========================================

// Get all courses assigned to the logged-in student
router.get('/assigned', authenticateUser, authorizeRoles('student'), getStudentAssignedCourses);


// ==========================================
// 👨‍🏫 MENTOR ROUTES
// ==========================================

// Get courses created by the logged-in mentor
router.get('/my', authenticateUser, authorizeRoles('mentor'), getMyCourses);

// Create a new course
router.post('/', authenticateUser, authorizeRoles('mentor'), createCourse);

// Update a course
router.put('/:courseId', authenticateUser, authorizeRoles('mentor'), updateCourse);

// Delete a course
router.delete('/:courseId', authenticateUser, authorizeRoles('mentor'), deleteCourse);

// Add a chapter to a specific course
router.post('/:courseId/chapters', authenticateUser, authorizeRoles('mentor'), addChapter);

// Assign a student to a course
router.post('/:courseId/assign', authenticateUser, authorizeRoles('mentor'), assignStudentToCourse);

export default router;