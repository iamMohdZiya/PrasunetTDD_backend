// src/controllers/userController.ts
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';

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



export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    // Fetch Courses with nested Mentor and Assignment data
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        created_at,
        mentor:users!mentor_id ( id, email ),
        assignments (
          student:users!student_id ( id, email )
        )
      `);

    if (error) throw error;

    // Format the data for easier frontend use
    const stats = courses.map((c: any) => ({
      courseId: c.id,
      title: c.title,
      mentorEmail: c.mentor?.email || 'Unknown',
      studentCount: c.assignments.length,
      students: c.assignments.map((a: any) => a.student?.email)
    }));

    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};