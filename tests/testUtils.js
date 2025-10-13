/**
 * Simple test utilities to help with basic testing
 */

/**
 * Generate a unique test email
 */
export function generateTestEmail() {
  return `test-${Date.now()}@example.com`;
}

/**
 * Create basic test user data
 */
export function createUserData(overrides = {}) {
  return {
    email: generateTestEmail(),
    password: 'password123',
    givenName: 'Test',
    familyName: 'User',
    ...overrides
  };
}

/**
 * Create basic test bug data
 */
export function createBugData(overrides = {}) {
  return {
    title: `Test Bug ${Date.now()}`,
    description: 'This is a test bug description',
    stepsToReproduce: 'Step 1: Create test\nStep 2: Run test',
    author: 'Test User',
    ...overrides
  };
}