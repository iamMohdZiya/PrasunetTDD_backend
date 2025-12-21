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
    
    // 🔍 CHECK 1: Are you extracting 'imageUrl' and 'description' here?
    const { 
      title, 
      description, 
      sequenceOrder, 
      contentUrl, 
      imageUrl // <--- Frontend sends 'imageUrl'
    } = req.body;

    if (!title || !sequenceOrder) {
      return res.status(400).json({ message: "Title and sequence order are required" });
    }

    // 🔍 CHECK 2: Are you passing them to Supabase here?
    const { data, error } = await supabase
      .from('chapters')
      .insert([
        {
          course_id: courseId,
          title,
          description: description || "",  // <--- Saving Description
          sequence_order: sequenceOrder,
          content_url: contentUrl,
          image_url: imageUrl || ""        // <--- Saving Image URL to 'image_url' column
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
// src/controllers/courseController.ts

// ... [Keep imports and other functions] ...

// 5. Get Courses Assigned to Student (FIXED & LOGGED)
export const getStudentAssignedCourses = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  console.log("🔍 Fetching courses for Student ID:", userId);

  try {
    // Query 'assignments' and join 'courses'
    // We explicitly select course info. If the relationship name is tricky, Supabase 
    // usually handles 'course:courses(*)' if there is a single FK.
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        course_id,
        course:courses (
          id,
          title,
          description,
          mentor_id
        )
      `)
      .eq('student_id', userId);

    if (error) {
      console.error("❌ Supabase Join Error:", error);
      throw error;
    }

    console.log("✅ Raw Assignments Found:", assignments?.length);

    if (!assignments || assignments.length === 0) {
      return res.json([]); // Return empty array if no assignments
    }
    
    // Filter out any entries where course is null (e.g. course was deleted)
    // and Flatten the structure so the frontend gets an array of courses
    const courses = assignments
      .map((item: any) => item.course)
      .filter((course: any) => course !== null);

    console.log("📤 Sending Courses to Frontend:", courses.length);
    res.json(courses);

  } catch (err: any) {
    console.error("❌ Server Error in getStudentAssignedCourses:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ... [Keep the rest of the file] ...

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

// 7. Update Course (Mentor or Admin)
export const updateCourse = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const { title, description } = req.body;
  const userId = req.user?.userId;
  const role = req.user?.role;

  try {
    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, mentor_id')
      .eq('id', courseId)
      .single();

    if (courseErr || !course) return res.status(404).json({ message: 'Course not found' });

    // Only the mentor who created the course or an admin can update
    if (role !== 'admin' && course.mentor_id !== userId) {
      return res.status(403).json({ message: 'Access Denied: Cannot edit this course' });
    }

    const { data, error } = await supabase
      .from('courses')
      .update({ title, description })
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Course updated', course: data });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 8. Delete Course (Mentor or Admin)
export const deleteCourse = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId;
  const role = req.user?.role;

  try {
    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, mentor_id')
      .eq('id', courseId)
      .single();

    if (courseErr || !course) return res.status(404).json({ message: 'Course not found' });

    if (role !== 'admin' && course.mentor_id !== userId) {
      return res.status(403).json({ message: 'Access Denied: Cannot delete this course' });
    }

    // Delete related records (assignments, progress, chapters) to be safe
    await supabase.from('assignments').delete().eq('course_id', courseId);
    await supabase.from('progress').delete().eq('course_id', courseId);
    await supabase.from('chapters').delete().eq('course_id', courseId);

    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) throw error;

    res.json({ message: 'Course deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 9. Update Chapter (Mentor or Admin)
export const updateChapter = async (req: AuthRequest, res: Response) => {
  const { courseId, chapterId } = req.params;
  const { title, description, sequenceOrder, contentUrl, imageUrl } = req.body;
  const userId = req.user?.userId;
  const role = req.user?.role;

  try {
    // Verify course exists and ownership
    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, mentor_id')
      .eq('id', courseId)
      .single();

    if (courseErr || !course) return res.status(404).json({ message: 'Course not found' });
    if (role !== 'admin' && course.mentor_id !== userId) return res.status(403).json({ message: 'Access Denied' });

    const { data, error } = await supabase
      .from('chapters')
      .update({ title, description, sequence_order: sequenceOrder, content_url: contentUrl, image_url: imageUrl })
      .eq('id', chapterId)
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Chapter updated', chapter: data });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 10. Delete Chapter (Mentor or Admin)
export const deleteChapter = async (req: AuthRequest, res: Response) => {
  const { courseId, chapterId } = req.params;
  const userId = req.user?.userId;
  const role = req.user?.role;

  try {
    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, mentor_id')
      .eq('id', courseId)
      .single();

    if (courseErr || !course) return res.status(404).json({ message: 'Course not found' });
    if (role !== 'admin' && course.mentor_id !== userId) return res.status(403).json({ message: 'Access Denied' });

    // Delete progress entries referencing this chapter first
    await supabase.from('progress').delete().eq('chapter_id', chapterId);

    const { error } = await supabase.from('chapters').delete().eq('id', chapterId).eq('course_id', courseId);
    if (error) throw error;

    res.json({ message: 'Chapter deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};