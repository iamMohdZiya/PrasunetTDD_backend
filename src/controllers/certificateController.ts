import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { supabase } from '../config/supabase';

export const getCertificate = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    // 1. Get Total Chapter Count
    const { count: totalChapters, error: countError } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true }) // 'head' means don't return data, just count
      .eq('course_id', courseId);

    if (countError) throw countError;

    // 2. Get User Completed Count
    const { count: completedCount, error: progressError } = await supabase
      .from('progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (progressError) throw progressError;

    // 3. Compare
    // Handle edge case where totalChapters might be null/0
    if (!totalChapters || completedCount === null || completedCount < totalChapters) {
      return res.status(403).json({ 
        message: `Course not completed. ${completedCount}/${totalChapters} chapters done.` 
      });
    }

    // 4. Success
    res.status(200).json({
      message: 'Certificate Generated',
      url: `https://your-bucket-url.supabase.co/certificates/${userId}-${courseId}.pdf`
    });

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};