import request from 'supertest';

// Import our Express app for testing
let app;

beforeAll(async () => {
  // Load the app before running tests
  const appModule = await import('../index.js');
  app = appModule.default;
});

describe('Basic API Tests', () => {
  
  // Test 1: Check if server responds
  test('should respond to home page', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    // The response should contain HTML (your React app)
    expect(response.text).toContain('html');
  });

  // Test 2: Try to register a new user
  test('should register a user', async () => {
    const newUser = {
      email: `testuser-${Date.now()}@example.com`,
      password: 'password123',
      givenName: 'Test',
      familyName: 'User'
    };

    const response = await request(app)
      .post('/api/users/register')
      .send(newUser)
      .expect(201);

    // Check that we got a token back
    expect(response.body.token).toBeDefined();
    expect(response.body.email).toBe(newUser.email);
  });

  // Test 3: Try to register with invalid data (should fail)
  test('should reject invalid user registration', async () => {
    const invalidUser = {
      email: 'not-an-email',  // Invalid email
      password: '123'         // Too short password
    };

    await request(app)
      .post('/api/users/register')
      .send(invalidUser)
      .expect(400);  // Should return 400 Bad Request
  });
});