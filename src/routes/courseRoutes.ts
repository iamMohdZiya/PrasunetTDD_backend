import express from 'express';
import { 
  createCourse, 
  addChapter, 
  getMyCourses, 
  assignStudentToCourse, 
  getStudentAssignedCourses, 
  getCourseWithChapters
} from '../controllers/courseController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// --- PUBLIC / SHARED ---
router.get('/:courseId', authenticate, getCourseWithChapters);

// --- STUDENT ROUTES ---
router.get('/assigned', authenticate, authorize(['student']), getStudentAssignedCourses);

// --- MENTOR ROUTES ---
router.get('/my', authenticate, authorize(['mentor']), getMyCourses);
router.post('/', authenticate, authorize(['mentor']), createCourse);
router.post('/:courseId/chapters', authenticate, authorize(['mentor']), addChapter);
router.post('/:courseId/assign', authenticate, authorize(['mentor']), assignStudentToCourse);

export default router;