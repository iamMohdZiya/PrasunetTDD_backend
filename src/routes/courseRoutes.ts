import { Router } from 'express';
import { 
  getCourseWithChapters, 
  createCourse, 
  addChapter, 
  getMyCourses,
  assignStudentToCourse,
  getStudentAssignedCourses,
  updateCourse,
  deleteCourse

} from '../controllers/courseController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Mentor Routes
router.get('/my', authenticate, authorize(['mentor']), getMyCourses);
router.post('/', authenticate, authorize(['mentor']), createCourse);
router.post('/:courseId/chapters', authenticate, authorize(['mentor']), addChapter);
router.post('/:courseId/assign', authenticate, authorize(['mentor']), assignStudentToCourse);
router.put('/:courseId', authenticate, authorize(['mentor']), updateCourse);
router.delete('/:courseId', authenticate, authorize(['mentor']), deleteCourse);
// Student Routes
router.get('/assigned', authenticate, authorize(['student']), getStudentAssignedCourses);
router.get('/:courseId', authenticate, getCourseWithChapters);

export default router;