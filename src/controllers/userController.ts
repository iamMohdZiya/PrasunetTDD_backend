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



// In src/controllers/userController.ts

export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    console.log("Admin Stats: Fetching...");

    // 1. Simpler Query (Removed strict !alias hints)
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        mentor:users!courses_mentor_id_fkey ( email ), 
        assignments (
          student:users ( email )
        )
      `);

    // Note: If the above fails, Supabase might just need standard joining:
    // .select('id, title, users(email), assignments(users(email))')
    
    if (error) {
      console.error("Supabase Error:", error); // <--- LOGS ERROR TO TERMINAL
      throw error;
    }

    // 2. Format Data Safely
    const stats = courses.map((c: any) => ({
      courseId: c.id,
      title: c.title,
      // Handle cases where mentor might be null
      mentorEmail: c.mentor?.email || 'Unknown', 
      studentCount: c.assignments?.length || 0,
      students: c.assignments?.map((a: any) => a.student?.email).filter(Boolean) || []
    }));

    res.json(stats);
  } catch (err: any) {
    console.error("Admin Stats Failed:", err.message);
    res.status(500).json({ message: 'Failed to load stats. Check server logs.' });
  }
};

// Add to src/controllers/userController.ts

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'User deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};