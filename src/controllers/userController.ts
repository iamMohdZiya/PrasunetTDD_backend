// src/controllers/userController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { supabase } from '../config/supabase';

// src/controllers/userController.ts

// 1. Get All Users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase.from('users').select('id, email, role, is_approved');
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

// 2. Approve Mentor
export const approveMentor = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('users')
    .update({ is_approved: true })
    .eq('id', id)
    .eq('role', 'mentor'); // Safety check

  if (error) return res.status(400).json({ message: error.message });
  res.json({ message: 'Mentor account approved' });
};