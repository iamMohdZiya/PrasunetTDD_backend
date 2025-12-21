import express from 'express';
import { 
  createCourse, 
  addChapter, 
  getMyCourses, 
  assignStudentToCourse, 
  getStudentAssignedCourses, 
  getCourseWithChapters
} from '../controllers/courseController';
// FIX 1: Import 'authenticate' and 'authorize' to match other files
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// --- PUBLIC / SHARED ---
// FIX 2: Use 'authenticate'
router.get('/:courseId', authenticate, getCourseWithChapters);

// --- STUDENT ROUTES ---
// FIX 3: Use 'authorize(['student'])' with an ARRAY
router.get('/assigned', authenticate, authorize(['student']), getStudentAssignedCourses);

// --- MENTOR ROUTES ---
router.get('/my', authenticate, authorize(['mentor']), getMyCourses);
router.post('/', authenticate, authorize(['mentor']), createCourse);
router.post('/:courseId/chapters', authenticate, authorize(['mentor']), addChapter);
router.post('/:courseId/assign', authenticate, authorize(['mentor']), assignStudentToCourse);

export default router;