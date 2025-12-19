// src/controllers/courseController.ts
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';

// ... (Keep existing createCourse, addChapter, getMyCourses) ...

// NEW: Assign Student to Course (Mentor Only)
export const assignStudentToCourse = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const { studentEmail } = req.body; // Mentors usually assign by email

  try {
    // 1. Find Student ID from Email
    const { data: student, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', studentEmail)
      .single();

    if (userError || !student) {
      return res.status(404).json({ message: 'Student email not found' });
    }

    // 2. Create Assignment
    const { error: assignError } = await supabase
      .from('assignments')
      .insert([{ course_id: courseId, student_id: student.id }]);

    if (assignError) {
      if (assignError.code === '23505') return res.status(400).json({ message: 'Student already assigned' });
      throw assignError;
    }

    res.status(200).json({ message: 'Student assigned successfully' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATED: Get Course (Enforce Assignment Check)
export const getCourseWithChapters = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    // 1. SECURITY CHECK: Is the student assigned?
    const { data: assignment, error: assignError } = await supabase
      .from('assignments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', userId)
      .single();

    // If no assignment found AND user is a student (Mentors/Admins might bypass this)
    if (!assignment && req.user?.role === 'student') {
      return res.status(403).json({ message: 'Access Denied: You are not assigned to this course.' });
    }

    // 2. Fetch Course & Chapters (Existing logic)
    const { data: course } = await supabase.from('courses').select('*').eq('id', courseId).single();
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const { data: chapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('course_id', courseId)
      .order('sequence_order', { ascending: true });

    res.status(200).json({ course, chapters });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// NEW: Get Assigned Courses (For Student Dashboard)
export const getStudentAssignedCourses = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    // Join assignments with courses
    const { data, error } = await supabase
      .from('assignments')
      .select('course:courses(*)') // Select the related course data
      .eq('student_id', userId);

    if (error) throw error;
    
    // Flatten structure
    const courses = data.map((item: any) => item.course);
    res.json(courses);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};