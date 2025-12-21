import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';

// ... (Other functions like createCourse, getMyCourses remain the same) ...

// [UPDATED] Add Chapter (Supports Description + Image)
export const addChapter = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    
    // Extract ALL fields including image_url and description
    const { 
      title, 
      description, 
      sequenceOrder, 
      contentUrl, 
      imageUrl // <--- NEW
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
          image_url: imageUrl || "" // <--- Saving Image URL
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

// [UPDATED] Get Course (Selects Description + Image)
export const getCourseWithChapters = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    // ... (Enrollment check logic remains the same) ...

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) return res.status(404).json({ message: 'Course not found' });

    // Select ALL new columns
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