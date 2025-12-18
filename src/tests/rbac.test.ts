import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';

// Helper to generate tokens for testing
const generateToken = (role: string) => {
  return jwt.sign(
    { userId: 'test-id', role }, 
    process.env.JWT_SECRET || 'super_secret_internship_key_123', 
    { expiresIn: '1h' }
  );
};

describe('RBAC Middleware', () => {
  
  // 1. Test Missing Token
  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toEqual(401);
  });

  // 2. Test Insufficient Permissions (Student trying to access Admin route)
  it('should return 403 if user does not have admin role', async () => {
    const studentToken = generateToken('student');

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${studentToken}`); // Send token in header

    expect(res.statusCode).toEqual(403); // Forbidden
  });

  // 3. Test Valid Access (Admin accessing Admin route)
  it('should return 200 if user is admin', async () => {
    const adminToken = generateToken('admin');

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
  });

});