// src/tests/auth.test.ts
import request from 'supertest';
import app from '../app';

describe('Auth Endpoints', () => {
  
  // Test Case 1: Register a new Student
  it('should register a new student and return 201 status', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'student@test.com',
        password: 'securePassword123',
        role: 'student' // Explicitly asking for student role
      });

    // EXPECTATIONS (Asserts)
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully');
    expect(res.body).toHaveProperty('userId'); // We expect an ID back
  });
  // Test Case 2: Login functionality
  it('should login a student and return a JWT token', async () => {
    // 1. Mock the specific user credentials we want to test
    const loginData = {
      email: 'student@test.com',
      password: 'securePassword123'
    };

    // 2. Make the request
    const res = await request(app)
      .post('/api/auth/login')
      .send(loginData);

    // 3. EXPECTATIONS
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token'); // Must receive a token
    expect(res.body.user).toHaveProperty('role', 'student'); // Response should confirm role
  });
});