import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock User Data (Acting as our Database for now)
const MOCK_USER = {
  id: 'uuid-1234-5678',
  email: 'student@test.com',
  passwordHash: '$2a$10$wI.q...hashedpassword...', // We won't check this strictly yet
  role: 'student'
};

export const register = async (req: Request, res: Response) => {
  res.status(201).json({
    message: 'User registered successfully',
    userId: 'some-mock-id', 
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // 1. Validate Input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  // 2. Find User (Mock DB check)
  if (email !== MOCK_USER.email) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // 3. Generate JWT
  const token = jwt.sign(
    { userId: MOCK_USER.id, role: MOCK_USER.role }, // Payload
    process.env.JWT_SECRET || 'default_secret',     // Secret Key
    { expiresIn: '1h' }                             // Options
  );

  // 4. Send Response
  res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: MOCK_USER.id,
      email: MOCK_USER.email,
      role: MOCK_USER.role
    }
  });
};