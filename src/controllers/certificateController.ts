import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { supabase } from '../config/supabase';
import PDFDocument from 'pdfkit';

export const getCertificate = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    // 1. Verify Completion
    const { count: totalChapters } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    const { count: completedChapters } = await supabase
      .from('progress')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('user_id', userId);

    if (!totalChapters || !completedChapters || completedChapters < totalChapters) {
      return res.status(403).json({ message: 'Course not 100% complete.' });
    }

    // 2. Fetch Info
    const { data: user } = await supabase.from('users').select('email').eq('id', userId).single();
    const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).single();

    // 3. Generate PDF
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${courseId}.pdf`);
    
    doc.pipe(res);

    // Design
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f0f0f0');
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).strokeColor('#2c3e50').lineWidth(5).stroke();

    // FIXED LINE BELOW: Removed 'valign'
    doc.fillColor('#2c3e50').fontSize(40).text('CERTIFICATE OF COMPLETION', { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(20).text('This certifies that', { align: 'center' });
    doc.moveDown();
    doc.fontSize(30).fillColor('#27ae60').text(user?.email || 'Student', { align: 'center' });
    doc.moveDown();
    doc.fillColor('#2c3e50').fontSize(20).text('Has successfully completed the course', { align: 'center' });
    doc.moveDown();
    doc.fontSize(25).text(course?.title || 'Course', { align: 'center' });
    doc.moveDown();
    doc.fontSize(15).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.end();

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};