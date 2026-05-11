import request from 'supertest';
import jwt from 'jsonwebtoken';

import { createBugData, createUserData } from './testUtils.js';

// Import our Express app for testing
let app;

beforeAll(async () => {
  // Load the app before running tests
  const appModule = await import('../index.js');
  app = appModule.default;
});

const createAuthToken = ({
  id = '507f1f77bcf86cd799439011',
  name = 'Test User',
  role = ['Admin'],
  permissions = { canCreateBug: true, canCloseAnyBug: true, canLogHours: true },
} = {}) => jwt.sign(
  {
    _id: id,
    name,
    role,
    permissions,
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

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

  test('should close and reopen a bug using boolean payloads', async () => {
    const token = createAuthToken();
    const authHeader = { Authorization: `Bearer ${token}` };

    const createResponse = await request(app)
      .post('/api/bugs')
      .set(authHeader)
      .send({
        ...createBugData(),
        author: 'Test User',
      })
      .expect(200);

    const bugId = createResponse.body.bugId;
    expect(bugId).toBeDefined();

    await request(app)
      .patch(`/api/bugs/${bugId}/close`)
      .set(authHeader)
      .send({ closed: true })
      .expect(200)
      .expect((response) => {
        expect(response.body.message).toContain('closed successfully');
      });

    const closedBugResponse = await request(app)
      .get(`/api/bugs/${bugId}`)
      .set(authHeader)
      .expect(200);

    expect(closedBugResponse.body.closed).toBe(true);
    expect(closedBugResponse.body.closedOn).toBeTruthy();

    await request(app)
      .patch(`/api/bugs/${bugId}/close`)
      .set(authHeader)
      .send({ closed: false })
      .expect(200)
      .expect((response) => {
        expect(response.body.message).toContain('reopened successfully');
      });

    const reopenedBugResponse = await request(app)
      .get(`/api/bugs/${bugId}`)
      .set(authHeader)
      .expect(200);

    expect(reopenedBugResponse.body.closed).toBe(false);
    expect(reopenedBugResponse.body.closedOn).toBeNull();
  });
  test('assign and permission enforcement for assigning bugs', async () => {
    // Create an admin token and a normal token
    const adminToken = createAuthToken({ permissions: { canCreateBug: true, canReassignAnyBug: true } });
    const noAssignToken = createAuthToken({ permissions: { canCreateBug: true, canReassignAnyBug: false } });

    const authHeader = { Authorization: `Bearer ${adminToken}` };
    const authHeaderNoAssign = { Authorization: `Bearer ${noAssignToken}` };

    const createResponse = await request(app)
      .post('/api/bugs')
      .set(authHeader)
      .send({ ...createBugData(), author: 'Test User' })
      .expect(200);

    const bugId = createResponse.body.bugId;

    // Register a user to assign to
    const newUser = createUserData();
    const registerRes = await request(app).post('/api/users/register').send(newUser).expect(201);
    const assignedToken = registerRes.body.token;
    const assignedPayload = jwt.decode(assignedToken);
    const assignedUserId = assignedPayload._id;
    const assignedUserName = registerRes.body.name;

    // Attempt to assign with a user that lacks permission -> 403
    await request(app)
      .patch(`/api/bugs/${bugId}/assign`)
      .set(authHeaderNoAssign)
      .send({ assignedToUserId: assignedUserId })
      .expect(403);

    // Assign with admin token -> succeed
    await request(app)
      .patch(`/api/bugs/${bugId}/assign`)
      .set(authHeader)
      .send({ assignedToUserId: assignedUserId, assignedToUserName: assignedUserName })
      .expect(200)
      .expect((res) => expect(res.body.message).toContain('assigned to'));
  });

  test('log hours permission and functionality', async () => {
    const adminToken = createAuthToken({ permissions: { canCreateBug: true } });
    const devToken = createAuthToken({ permissions: { canLogHours: true } });
    const noLogToken = createAuthToken({ permissions: { canLogHours: false } });

    const adminHeader = { Authorization: `Bearer ${adminToken}` };
    const devHeader = { Authorization: `Bearer ${devToken}` };
    const noLogHeader = { Authorization: `Bearer ${noLogToken}` };

    const createResponse = await request(app)
      .post('/api/bugs')
      .set(adminHeader)
      .send({ ...createBugData(), author: 'Test User' })
      .expect(200);

    const bugId = createResponse.body.bugId;

    // No-permission user should get 403
    await request(app)
      .post(`/api/bugs/${bugId}/log-hours`)
      .set(noLogHeader)
      .send({ hours: 2, version: '1.0', dateFixed: new Date().toISOString(), notes: 'Worked on fix' })
      .expect(403);

    // Developer logs hours -> succeed
    await request(app)
      .post(`/api/bugs/${bugId}/log-hours`)
      .set(devHeader)
      .send({ hours: 3, version: '1.1', dateFixed: new Date().toISOString(), notes: 'More work' })
      .expect(200)
      .expect((res) => expect(res.body.message).toContain('Hours logged'));
  });

  test('test-case CRUD and ownership checks', async () => {
    const adminToken = createAuthToken({ permissions: { canCreateBug: true } });
    const addTestToken = createAuthToken({ permissions: { canAddTestCase: true, canEditTestCase: true, canDeleteTestCase: true } });
    const noTestToken = createAuthToken({ permissions: { canAddTestCase: false } });

    const adminHeader = { Authorization: `Bearer ${adminToken}` };
    const addTestHeader = { Authorization: `Bearer ${addTestToken}` };
    const noTestHeader = { Authorization: `Bearer ${noTestToken}` };

    const createBugRes = await request(app)
      .post('/api/bugs')
      .set(adminHeader)
      .send({ ...createBugData(), author: 'Test User' })
      .expect(200);

    const bugId = createBugRes.body.bugId;

    // Unauthorized to add test
    await request(app)
      .post(`/api/bugs/${bugId}/tests`)
      .set(noTestHeader)
      .send({ title: 'Test Case 1', description: 'Desc', status: 'Pending' })
      .expect(403);

    // Add test as permitted user
    const addRes = await request(app)
      .post(`/api/bugs/${bugId}/tests`)
      .set(addTestHeader)
      .send({ title: 'Test Case 1', description: 'Desc', status: 'Pending' })
      .expect(201);

    const testId = addRes.body.testId;

    // Fetch list of tests for bug
    const listRes = await request(app)
      .get(`/api/bugs/${bugId}/tests`)
      .set(addTestHeader)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);

    // Get specific test
    await request(app)
      .get(`/api/bugs/${bugId}/tests/${testId}`)
      .set(addTestHeader)
      .expect(200)
      .expect((res) => expect(res.body._id).toBeDefined());

    // Update test
    await request(app)
      .patch(`/api/bugs/${bugId}/tests/${testId}`)
      .set(addTestHeader)
      .send({ title: 'Updated Title' })
      .expect(200);

    // Delete test
    await request(app)
      .delete(`/api/bugs/${bugId}/tests/${testId}`)
      .set(addTestHeader)
      .expect(200);
  });

});