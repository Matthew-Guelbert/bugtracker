import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

let mongoServer;
let mongoUri;

// Setup in-memory MongoDB for testing
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  mongoUri = mongoServer.getUri();
  
  // Override the database connection for tests - set both env vars for compatibility
  process.env.DB_URL = mongoUri;
  process.env.DB_NAME = 'test_bugtracker';
  process.env.MONGODB_CONNECTION_STRING = mongoUri; // Backup env var
  process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
  process.env.NODE_ENV = 'test';
  
  console.log('✅ Test environment configured with DB:', mongoUri);
});

afterAll(async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Clear database between tests
beforeEach(async () => {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('test_bugtracker');
  
  // Clear all collections
  const collections = await db.listCollections().toArray();
  await Promise.all(
    collections.map(collection => 
      db.collection(collection.name).deleteMany({})
    )
  );
  
  await client.close();
});

// Timeout is handled in jest.config.js