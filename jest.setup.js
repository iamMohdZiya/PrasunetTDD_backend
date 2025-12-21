// jest.setup.js
// This file runs BEFORE your tests to set up fake environment variables.
process.env.SUPABASE_URL = 'https://mock-url.supabase.co';
process.env.SUPABASE_KEY = 'mock-key-123';
process.env.JWT_SECRET = 'test-secret';
process.env.PORT = '5000';