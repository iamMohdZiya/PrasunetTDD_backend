// src/app.ts
import express, { Application, Request, Response } from 'express';

const app: Application = express();

app.use(express.json());
import authRoutes from './routes/authRoutes';
// ...
app.use('/api/auth', authRoutes);
// Root route to verify app is running
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'LMS Backend is running' });
});

// Auth endpoints
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  
  // Basic validation
  if (!email || !password || !role) {
    res.status(400).json({ message: 'Missing required fields' });
    return;
  }
  
  // Mock user creation (in real app, would save to database)
  const userId = Math.random().toString(36).substr(2, 9);
  
  res.status(201).json({
    message: 'User registered successfully',
    userId: userId
  });
});

export default app;