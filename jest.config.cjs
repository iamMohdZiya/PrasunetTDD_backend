module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // This line is CRITICAL: it loads the fake env vars from jest.setup.js
  setupFiles: ['<rootDir>/jest.setup.js'], 
  
  testMatch: ['**/*.test.ts'], // Looks for .test.ts files
  collectCoverage: true,       // Force coverage report generation
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/config/",
    "/dist/"
  ]
};