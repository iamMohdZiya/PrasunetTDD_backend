// src/routes/courseRoutes.ts
import { Router } from 'express';
import { 
  getCourseWithChapters, 
  createCourse, 
  addChapter, 
  getMyCourses,
  assignStudentToCourse,     // <--- Import
  getStudentAssignedCourses  // <--- Import
} from '../controllers/courseController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// ==========================
// 1. SPECIFIC ROUTES (TOP)
// ==========================

// Mentor: Get Created Courses
router.get('/my', authenticate, authorize(['mentor']), getMyCourses);

// Student: Get Assigned Courses
router.get('/assigned', authenticate, authorize(['student']), getStudentAssignedCourses); 

// Mentor: Create Course
router.post('/', authenticate, authorize(['mentor']), createCourse);

// Mentor: Assign Student [cite: 120, 121]
router.post('/:courseId/assign', authenticate, authorize(['mentor']), assignStudentToCourse);

// ==========================
// 2. DYNAMIC ROUTES (BOTTOM)
// ==========================

// Mentor: Add Chapter
router.post('/:courseId/chapters', authenticate, authorize(['mentor']), addChapter);

// Student: View Course (Now Protected)
router.get('/:courseId', authenticate, getCourseWithChapters);

export default router;