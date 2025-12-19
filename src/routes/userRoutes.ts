// src/routes/userRoutes.ts
import { Router } from 'express';
import { getAllUsers, approveMentor, getAdminStats } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Get Admin Dashboard Stats (Internship Overview)
router.get('/stats', authenticate, authorize(['admin']), getAdminStats);

// Existing User Management
router.get('/', authenticate, authorize(['admin']), getAllUsers);
router.put('/:id/approve-mentor', authenticate, authorize(['admin']), approveMentor);

export default router;