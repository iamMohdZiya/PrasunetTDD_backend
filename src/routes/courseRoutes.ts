import express from 'express';
import { 
  createCourse, 
  addChapter, 
  getMyCourses, 
  assignStudentToCourse, 
  getStudentAssignedCourses, 
  getCourseWithChapters
} from '../controllers/courseController';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware';

const router = express.Router();

// --- PUBLIC / SHARED ---
router.get('/:courseId', authenticateUser, getCourseWithChapters);

// --- STUDENT ROUTES ---
router.get('/assigned', authenticateUser, authorizeRoles('student'), getStudentAssignedCourses);

// --- MENTOR ROUTES ---
router.get('/my', authenticateUser, authorizeRoles('mentor'), getMyCourses);
router.post('/', authenticateUser, authorizeRoles('mentor'), createCourse);
router.post('/:courseId/chapters', authenticateUser, authorizeRoles('mentor'), addChapter);
router.post('/:courseId/assign', authenticateUser, authorizeRoles('mentor'), assignStudentToCourse);

export default router;