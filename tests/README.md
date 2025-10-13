# Testing Guide

This project uses Jest for testing with a basic setup to get you started.

## Files

- `tests/setup.js` - Configures the test environment with an in-memory database
- `tests/simple.test.js` - Basic API tests to get you started
- `tests/testUtils.js` - Helper functions for creating test data
- `jest.config.js` - Jest configuration

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs when files change)
npm run test:watch
```

## Basic Test Structure

Tests use this pattern:

```javascript
describe('What you are testing', () => {
  test('should do something specific', async () => {
    // Arrange: Set up test data
    const testData = { /* ... */ };
    
    // Act: Make the API call
    const response = await request(app)
      .post('/api/endpoint')
      .send(testData)
      .expect(200);
    
    // Assert: Check the results
    expect(response.body.someField).toBeDefined();
  });
});
```

## Available Helpers

From `testUtils.js`:

```javascript
import { generateTestEmail, createUserData, createBugData } from './testUtils.js';

// Generate unique test email
const email = generateTestEmail();

// Create test user data
const user = createUserData({ givenName: 'Custom' });

// Create test bug data  
const bug = createBugData({ title: 'Custom Bug' });
```

## Learning Next Steps

1. Add more tests to `simple.test.js`
2. Create new test files for specific features
3. Test error conditions and edge cases
4. Learn about mocking external services
5. Add integration tests that test multiple endpoints together

## Tips

- Each test should be independent (don't rely on other tests)
- Use descriptive test names that explain what you're testing
- Test both success and failure cases
- The in-memory database resets between each test automatically