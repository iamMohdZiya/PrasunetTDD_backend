import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { supabase } from '../config/supabase';
import PDFDocument from 'pdfkit';

export const getCertificate = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;

  try {
    // 1. Verify Completion (Same logic as before)
    // ... (Keep your existing check logic here) ...
    // Assume we passed the checks:

    // 2. Fetch User & Course Names for the Certificate
    const { data: user } = await supabase.from('users').select('email').eq('id', userId).single();
    const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).single();

    // 3. Generate PDF
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });

    // Stream directly to the browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${courseId}.pdf`);
    
    doc.pipe(res);

    // Design the Certificate
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f0f0f0'); // Background
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).strokeColor('#2c3e50').lineWidth(5).stroke(); // Border

    doc.fillColor('#2c3e50').fontSize(40).text('CERTIFICATE OF COMPLETION', { align: 'center', valign: 'center' });
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