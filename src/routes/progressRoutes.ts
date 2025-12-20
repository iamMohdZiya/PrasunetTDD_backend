import { Router } from 'express';

import { getMyProgress,completeChapter } from '../controllers/progressController'; 
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.post('/complete', authenticate, authorize(['student']), completeChapter);
router.get('/my', authenticate, authorize(['student']), getMyProgress); 

export default router;