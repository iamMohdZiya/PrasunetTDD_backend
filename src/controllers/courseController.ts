import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getCourseWithChapters = async (req: Request, res: Response) => {
  const { courseId } = req.params;

  try {
    // 1. Fetch Course Details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // 2. Fetch Chapters (Sorted)
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