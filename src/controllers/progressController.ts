import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { supabase } from '../config/supabase';

export const completeChapter = async (req: AuthRequest, res: Response) => {
  const { courseId, chapterId, sequenceOrder } = req.body;
  const userId = req.user?.userId;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // 1. CHECK PREREQUISITES (If not the first chapter)
    if (sequenceOrder > 1) {
      const { data: prevProgress } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('chapter_id', chapterId - 1) // Assuming chapter_id aligns with sequence for simplicity
        // In a real app, you'd fetch the chapter by sequence_order first
        .single();

      if (!prevProgress) {
        return res.status(400).json({ 
          message: 'Prerequisite not met: Complete previous chapters first.' 
        });
      }
    }

    // 2. SAVE PROGRESS
    const { error } = await supabase
      .from('progress')
      .insert([{ user_id: userId, course_id: courseId, chapter_id: chapterId }]);

    if (error) {
        // Handle duplicate entry (Unique constraint) gracefully
        if (error.code === '23505') return res.status(200).json({ message: 'Already completed' });
        throw error;
    }

    res.status(200).json({ message: 'Chapter completed successfully' });

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};