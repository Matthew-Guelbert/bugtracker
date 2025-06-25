import * as dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcrypt';

import { MongoClient, ObjectId } from 'mongodb';
import { connectToDatabase } from './database.js';
import debug from 'debug';
const debugDb = debug('app:database');

// Generate/Parse an ObjectId from a string
const newId = (str) => {
  if (!str || typeof str !== 'string' || !ObjectId.isValid(str)) {
    throw new Error('Invalid ObjectId string');
  }
  return new ObjectId(str);
};

// Global variable storing the db connection, do not use this directly
let _db = null;

// Connect to the database
async function connectToDatabase() {
  if (!_db) {
    const dbUrl = process.env.DB_URL;
    const dbName = process.env.DB_NAME;

    if (!dbUrl) {
      throw new Error('DB_URL is not defined in environment variables');
    }
    if (!dbName) {
      throw new Error('DB_NAME is not defined in environment variables');
    }

    try {
      const client = await MongoClient.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      _db = client.db(dbName);
      debugDb(`Connected to database: ${dbName}`);
    } catch (err) {
      debugDb(`Error connecting to database: ${err.message}`);
      throw err;
    }
  }
  return _db;
}


// Connect to the db and verify the connection
async function ping() {
  try {
    const db = await connectToDatabase();
    const pong = await db.command({ ping: 1 });
    debugDb(`Ping response: ${JSON.stringify(pong)}`);
  } catch (err) {
    debugDb(`Ping failed: ${err.message}`);
    throw err;
  }
}

/* Functions */

/* User Functions */

// Get All Users
async function GetAllUsers({ keywords, role, maxAge, minAge, sortBy, pageSize = 5, pageNumber = 1 }) {
  debugDb('GetAllUsers called with:', { keywords, role, maxAge, minAge, sortBy, pageSize, pageNumber });

  try {
    const db = await connectToDatabase();
    const match = {};
    const sortOptions = getSortOptions(sortBy, 'user');

    // Keywords search (partial text search)
    if (keywords) {
      match.$or = [
        { givenName: { $regex: keywords, $options: 'i' } },
        { familyName: { $regex: keywords, $options: 'i' } },
        { email: { $regex: keywords, $options: 'i' } }
      ];
    }

    // Role filter
    if (role) {
      match.role = role;
    }

    // Age filter
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const createdOnFilter = {};

    if (typeof minAge === 'number' && minAge > 0) {
      const minCreatedDate = new Date(today);
      minCreatedDate.setDate(minCreatedDate.getDate() - minAge);
      createdOnFilter.$lte = minCreatedDate; // Created within the last minAge days
    }

    if (typeof maxAge === 'number' && maxAge > 0) {
      const maxCreatedDate = new Date(today);
      maxCreatedDate.setDate(maxCreatedDate.getDate() - maxAge);
      createdOnFilter.$gte = maxCreatedDate; // Created at least maxAge days ago
    }

    if (Object.keys(createdOnFilter).length > 0) {
      match.createdOn = createdOnFilter;
    }

    // Pagination
    pageNumber = parseInt(pageNumber) || 1;
    pageSize = parseInt(pageSize) || 5;
    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    const pipeline = [
      { $match: match },
      ...Object.keys(sortOptions).length ? [{ $sort: sortOptions }] : [],
      { $skip: skip },
      { $limit: limit }
    ];

    const cursor = db.collection('Users').aggregate(pipeline);
    const users = await cursor.toArray();

    users.forEach(user => {
      console.log(`User: ${user.givenName} ${user.familyName}, Email: ${user.email}, Role: ${user.role}`);
    })

    // Count total users matching the criteria
    const totalUsers = await db.collection('Users').countDocuments(match);
    const totalPages = Math.ceil(totalUsers / pageSize);

    // Return the result with pagination info
    return {
      users,
      totalUsers,
      totalPages,
      pageNumber,
      pageSize
    };
  } catch (err) {
    debugDb(`Error in GetAllUsers: ${err.message}`);
    throw new Error(`Failed to get users: ${err.message}`);
  }
}

// Get User by ID
async function GetUserById(id) {
  debugDb(`GetUserById called with ID: ${id}`);

  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid ObjectId format');
  }

  const db = await connectToDatabase();
  const objectId = new ObjectId(id);

  try {
    const user = await db.collection('Users').findOne(
      { _id: objectId },
      { projection: { password: 0 } }
    );

    return user || null;
  } catch (err) {
    debugDb(`Error in GetUserById: ${err.message}`);
    throw new Error(`Failed to get user by ID: ${err.message}`);
  }
}

// Get User by Email
async function GetUserByEmail(email) {
  const db = await connectToDatabase();

  try {
    const cleanEmail = email.trim().toLowerCase();
    const user = await db.collection('Users').findOne({ email: cleanEmail });
    return user;
  } catch (err) {
    console.error(`Error in GetUserByEmail: ${err.message}`);
    throw new Error(`Failed to get user by email: ${err.message}`);
  }
}

// Register User
async function RegisterUser(user) {
  const db = await connectToDatabase();

  try {
    // Check if user with the same email already exists
    const existingUser = await db.collection('Users').findOne({ email: user.email });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Assign new ID and creation date
    const newUser = {
      ...user,
      _id: new ObjectId(),
      createdOn: new Date(),
    };

    debugDb(`User registered: ID=${newUser._id}, Email=${newUser.email}, Date=${newUser.createdOn.toISOString()}`);

    return resourceLimits;
  } catch (err) {
    debugDb(`Error in RegisterUser: ${err.message}`);
    throw new Error(`Failed to register user: ${err.message}`);
  }
}

// Login User
async function LoginUser(email) {
  const db = await connectToDatabase();

  try {
    const user = await db.collection('Users').findOne({ email });
    return user;
  } catch (err) {
    debugDb(`Error in LoginUser: ${err.message}`);
    throw new Error(`Failed to login user: ${err.message}`);
  }
}

// Update User
async function UpdateUser(updatedUser) {
  const db = await connectToDatabase();

  try {
    const { _id, ...updateFields } = updatedUser;

    if (!ObjectId.isValid(_id)) {
      throw new Error('Invalid ObjectId format');
    }

    const result = await db.collection('Users').updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateFields }
    );

    debugDb(`UpdateUser: Modified ${result.modifiedCount} document(s) for ID ${_id}`);
    return result;
  } catch (err) {
    debugDb(`Error in UpdateUser: ${err.message}`);
    throw new Error(`Failed to update user: ${err.message}`);
  }
}

// Delete User
async function DeleteUser(id) {
  const db = await connectToDatabase();

  try {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid ObjectId for deletion');
    }

    const result = await db.collection("Users").deleteOne({ _id: new ObjectId(id) });

    debugDb(`DeleteUser: Deleted ${result.deletedCount} document(s) for ID ${id}`);
    return result;
  } catch (error) {
    debugDb(`Error in DeleteUser: ${error.message}`);
    throw new Error('Error deleting user');
  }
}

// Bug Functions

// Get All Bugs
async function GetAllBugs() {
  debugDb('GetAllBugs endpoint called');

  try {
    const db = await connectToDatabase();
    const bugs = await db.collection('Bugs').find({}).toArray();
    debugDb(`Found ${bugs.length} bugs`);
    return bugs;
  } catch (err) {
    console.error('Error in GetAllBugs:', err.message);
    throw new Error(`Failed to get bugs: ${err.message}`);
  }
};