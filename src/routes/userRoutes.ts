import { Router } from 'express';
import { getAllUsers, approveMentor } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Admin Only Routes
router.get('/', authenticate, authorize(['admin']), getAllUsers);
router.put('/:id/approve-mentor', authenticate, authorize(['admin']), approveMentor);

export default router;