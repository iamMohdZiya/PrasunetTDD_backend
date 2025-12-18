import { Router } from 'express';
import { getCertificate } from '../controllers/certificateController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/:courseId', authenticate, getCertificate);

export default router;