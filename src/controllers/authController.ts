import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';

// REGISTER
export const register = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  try {
    // 1. Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // 2. Insert into Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password_hash: passwordHash, role: role || 'student' }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ 
      message: 'User registered successfully', 
      userId: data.id 
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Registration failed' });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Find User
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Generate Token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
};