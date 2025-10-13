export default {
  // Basic Jest configuration for ES modules
  testEnvironment: 'node',
  
  // Handle ES module imports
  transform: {},
  
  // Look for test files in the tests folder
  testMatch: ['**/tests/**/*.test.js'],
  
  // Setup file to configure test environment
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Basic settings
  verbose: true,
  testTimeout: 15000,
  forceExit: true
};