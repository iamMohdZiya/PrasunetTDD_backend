// src/routes/authRoutes.ts
import { Router } from 'express';
// ✅ GOOD: Single import line for both functions
import { register, login } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);

export default router;