import { Router } from 'express';
import { getCourseWithChapters } from '../controllers/courseController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Allow any logged-in user to view the course content
router.get('/:courseId', authenticate, getCourseWithChapters);

export default router;