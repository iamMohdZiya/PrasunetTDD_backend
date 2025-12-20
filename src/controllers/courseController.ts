import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';

// ==========================================
// MENTOR FUNCTIONS
// ==========================================

// 1. Create a New Course
export const createCourse = async (req: AuthRequest, res: Response) => {
  const { title, description } = req.body;
  const mentorId = req.user?.userId;

  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([{ title, description, mentor_id: mentorId }])
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// 2. Add a Chapter to a Course
export const addChapter = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const { title, sequenceOrder, contentUrl } = req.body;

  try {
    const { data, error } = await supabase
      .from('chapters')
      .insert([{ 
        course_id: courseId, 
        title, 
        sequence_order: sequenceOrder, 
        content_url: contentUrl 
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// 3. Get All Courses Created by Mentor
export const getMyCourses = async (req: AuthRequest, res: Response) => {
  const mentorId = req.user?.userId;
  
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('mentor_id', mentorId);
      
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Assign a Student to a Course
export const assignStudentToCourse = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const { studentEmail } = req.body;

  try {
    // A. Find Student ID
    const { data: student, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', studentEmail)
      .single();

    if (userError || !student) {
      return res.status(404).json({ message: 'Student email not found' });
    }

    // B. Assign
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


// ==========================================
// STUDENT FUNCTIONS
// ==========================================

// 5. Get Courses Assigned to Student
export const getStudentAssignedCourses = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('course:courses(*)')
      .eq('student_id', userId);

    if (error) throw error;
    
    // Map the nested object to a flat list
    const courses = data.map((item: any) => item.course);
    res.json(courses);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 6. Get Single Course Content (Verified Access)
export const getCourseWithChapters = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    // A. Check Assignment (Unless Admin/Mentor)
    if (req.user?.role === 'student') {
      const { data: assignment } = await supabase
        .from('assignments')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_id', userId)
        .single();

      if (!assignment) {
        return res.status(403).json({ message: 'Access Denied: You are not assigned to this course.' });
      }
    }

    // B. Get Course Info
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) return res.status(404).json({ message: 'Course not found' });

    // C. Get Chapters
    const { data: chapters, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('course_id', courseId)
      .order('sequence_order', { ascending: true });

    if (chapterError) throw chapterError;

    res.status(200).json({ course, chapters });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Add these to src/controllers/courseController.ts

// [PUT] Update Course Details
export const updateCourse = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const { title, description } = req.body;
  
  try {
    const { error } = await supabase
      .from('courses')
      .update({ title, description })
      .eq('id', courseId)
      .eq('mentor_id', req.user?.userId); // Security: Only owner can edit

    if (error) throw error;
    res.json({ message: 'Course updated successfully' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// [DELETE] Delete Course (and all its chapters/assignments)
export const deleteCourse = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;

  try {
    // Note: In a real DB, you'd use CASCADE delete. 
    // Here we might need to manually delete related rows if CASCADE isn't set up.
    
    // 1. Delete Chapters
    await supabase.from('chapters').delete().eq('course_id', courseId);
    
    // 2. Delete Assignments
    await supabase.from('assignments').delete().eq('course_id', courseId);
    
    // 3. Delete Course
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .eq('mentor_id', req.user?.userId);

    if (error) throw error;
    res.json({ message: 'Course deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};