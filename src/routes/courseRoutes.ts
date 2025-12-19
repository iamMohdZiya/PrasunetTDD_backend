import { Router } from 'express';
import { getCourseWithChapters, createCourse, addChapter, getMyCourses } from '../controllers/courseController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Student routes
router.get('/:courseId', authenticate, getCourseWithChapters);

// Mentor routes
router.post('/', authenticate, authorize(['mentor']), createCourse);
router.get('/my', authenticate, authorize(['mentor']), getMyCourses);
router.post('/:courseId/chapters', authenticate, authorize(['mentor']), addChapter);

export default router;