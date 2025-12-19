import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware'; 

// 1. Get Course Content (Student)
export const getCourseWithChapters = async (req: Request, res: Response) => {
  const { courseId } = req.params;

  try {
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) return res.status(404).json({ message: 'Course not found' });

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

// 2. Create Course (Mentor)
export const createCourse = async (req: AuthRequest, res: Response) => {
  const { title, description } = req.body;
  const mentorId = req.user?.userId;

  const { data, error } = await supabase
    .from('courses')
    .insert([{ title, description, mentor_id: mentorId }])
    .select();

  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json(data);
};

// 3. Add Chapter (Mentor)
export const addChapter = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const { title, sequenceOrder, contentUrl } = req.body;

  const { data, error } = await supabase
    .from('chapters')
    .insert([{ course_id: courseId, title, sequence_order: sequenceOrder, content_url: contentUrl }])
    .select();

  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json(data);
};

// 4. Get My Courses (Mentor)
export const getMyCourses = async (req: AuthRequest, res: Response) => {
  const mentorId = req.user?.userId;
  const { data } = await supabase.from('courses').select('*').eq('mentor_id', mentorId);
  res.json(data);
};