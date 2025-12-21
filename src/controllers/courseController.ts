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

// 2. Add a Chapter
export const addChapter = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    
    // Extract fields from frontend payload
    const { 
      title, 
      description, 
      sequenceOrder, 
      contentUrl, 
      imageUrl // Frontend sends 'imageUrl'
    } = req.body;

    if (!title || !sequenceOrder) {
      return res.status(400).json({ message: "Title and sequence order are required" });
    }

    const { data, error } = await supabase
      .from('chapters')
      .insert([
        {
          course_id: courseId,
          title,
          description: description || "", 
          sequence_order: sequenceOrder,
          content_url: contentUrl,
          image_url: imageUrl || "" // Map 'imageUrl' to DB column 'image_url'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Chapter added successfully", chapter: data });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Get Courses for Mentor
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

// 4. Assign Student
export const assignStudentToCourse = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const { studentEmail } = req.body;

  try {
    // A. Find Student ID from 'users' table
    const { data: student, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', studentEmail)
      .single();

    if (userError || !student) {
      return res.status(404).json({ message: 'Student email not found' });
    }

    // B. Insert into 'assignments' table
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

// 5. Get Assigned Courses
export const getStudentAssignedCourses = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    // Query 'assignments' and join 'courses'
    const { data, error } = await supabase
      .from('assignments')
      .select('course:courses(*)')
      .eq('student_id', userId);

    if (error) throw error;
    
    // Flatten structure
    const courses = data.map((item: any) => item.course);
    res.json(courses);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 6. Get Single Course + Chapters
export const getCourseWithChapters = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    // A. Security Check: Is student enrolled?
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

    // B. Get Course Details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) return res.status(404).json({ message: 'Course not found' });

    // C. Get Chapters (Selecting description & image_url explicitly)
    const { data: chapters, error: chapterError } = await supabase
      .from('chapters')
      .select('id, title, description, sequence_order, content_url, image_url') 
      .eq('course_id', courseId)
      .order('sequence_order', { ascending: true });

    if (chapterError) throw chapterError;

    res.status(200).json({ course, chapters });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};