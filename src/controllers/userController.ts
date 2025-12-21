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

    // 1. Fetch courses with mentor and assignments
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        mentor:users!courses_mentor_id_fkey ( id, email, full_name ), 
        assignments (
          student_id,
          student:users ( id, email, full_name )
        )
      `);

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    // 2. Enrich with completion data
    const stats = await Promise.all(courses.map(async (c: any) => {
      // Get total chapters
      const { count: totalChapters } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', c.id);

      // For each student, get their completion status
      const studentStats = await Promise.all(
        (c.assignments || []).map(async (a: any) => {
          const { count: completed } = await supabase
            .from('progress')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', c.id)
            .eq('user_id', a.student_id);

          const totalCount = totalChapters || 0;
          const completedCount = completed || 0;
          const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

          return {
            studentId: a.student_id,
            studentEmail: a.student?.email || 'Unknown',
            studentName: a.student?.full_name || 'Unknown',
            completed: completedCount,
            total: totalCount,
            percentage,
            isCompleted: completedCount >= totalCount && totalCount > 0
          };
        })
      );

      const completedCount = studentStats.filter(s => s.isCompleted).length;
      const notCompletedCount = studentStats.filter(s => !s.isCompleted).length;

      return {
        courseId: c.id,
        title: c.title,
        mentorId: c.mentor?.id,
        mentorEmail: c.mentor?.email || 'Unknown',
        mentorName: c.mentor?.full_name || 'Unknown',
        totalChapters: totalChapters || 0,
        totalStudents: studentStats.length,
        studentsCompleted: completedCount,
        studentsNotCompleted: notCompletedCount,
        studentDetails: studentStats
      };
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