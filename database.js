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

// Get Bug by ID
async function GetBugById(id) {
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid bug ID format');
  }

  try {
    const db = await connectToDatabase();
    const bug = await db.collection('Bugs').findOne(
      { _id: new ObjectId(id) }
    );

    if (!bug) {
      debugDb(`No bug found with ID: ${id}`);
      return null;
    }

    return bug;
  } catch (error) {
    debugDb(`Error in GetBugById: ${error.message}`);
    throw new Error('Error retrieving bug');
  }
}

// Create Bug
async function CreateBug(bug) {
  try {
    const db = await connectToDatabase();

    // Add createdOn date if already not present
    const bugWithMeta = {
      ...bug,
      createdOn: bug.createdOn || new Date(),
    };

    const dbResult = await db.collection('Bugs').insertOne(bugWithMeta);

    debugDb(`Bug created with ID: ${dbResult.insertedId}`);
    return dbResult;
  } catch (err) {
    debugDb(`Error creating bug: ${err.message}`);
    throw new Error(`Failed to create bug: ${err.message}`);
  }
}

// Update Bug
async function UpdateBug(bugId, update) {
  const db = await connectToDatabase();

  try {
    const dbResult = await db.collection('Bugs').updateOne(
      { _id: new ObjectId(bugId) },
      { $set: update }
    );

    debugDb(`Bug updated with ID: ${bugId}, Modified Count: ${dbResult.modifiedCount}`);
    return dbResult;
  } catch (err) {
    debugDb(`Error updating bug: ${err.message}`);
    throw new Error(`Failed to update bug: ${err.message}`);
  }
}

// Close Bug
async function CloseBug(bugId, updatedFields) {
  const db = await connectToDatabase();

  try {
    if (!ObjectId.isValid(bugId)) {
      throw new Error('Invalid bug ID format');
    }

    const dbResult = await db.collection('Bugs').updateOne(
      { _id: new ObjectId(bugId) },
      { $set: updatedFields }
    );

    debugDb(`Bug closed with ID: ${bugId}, Modified Count: ${dbResult.modifiedCount}`);
    return dbResult;
  } catch (err) {
    debugDb(`Error closing bug: ${err.message}`);
    throw new Error(`Failed to close bug: ${err.message}`);
  }
}


// Comment Functions
// We'll add the comment and test functions later once things are working.

// Get All Comments for a Bug
async function GetAllComments() {
  debugDb('GetAllComments endpoint called');

  try {
    const db = await connectToDatabase();
    const comments = await db.collection('Comments').find({}).toArray();
    debugDb(`Found ${comments.length} comments`);
    return comments;
  } catch (err) {
    console.error('Error in GetAllComments:', err.message);
    throw new Error(`Failed to get comments: ${err.message}`);
  }
}


// Universal functions for user.js and bug.js

function getSortOptions(sortBy, type) {
  const sort = {};

  if (type === 'user') {
    switch (sortBy) {
      case 'givenName':
        sort['givenName'] = 1; // Ascending
        sort['familyName'] = 1; // Ascending
        sort['createdOn'] = 1; // Ascending
        break;
      case 'familyName':
        sort['familyName'] = 1; // Ascending
        sort['givenName'] = 1; // Ascending
        sort['createdOn'] = 1; // Ascending
        break;
      case 'role':
        sort['role'] = 1; // Ascending
        sort['givenName'] = 1; // Ascending
        sort['familyName'] = 1; // Ascending
        sort['createdOn'] = 1; // Ascending
        break;
      case 'newest':
        sort['createdOn'] = -1; // Descending
        break;
      case 'oldest':
        sort['createdOn'] = 1; // Ascending
        break;
      default:
        sort['givenName'] = 1; // Default sort by givenName ascending
    }
  } else if (type === 'bug') {
    switch (sortBy){
      case 'title':
        sort['title'] = 1;
        sort['createdOn'] = -1;
        break
      case 'classification':
        sort['classification'] = 1;
        sort['createdOn'] = -1;
        break;
      case 'assignedToName':
        sort['assignedToName'] = 1;
        sort['createdOn'] = -1;
        break;
      case 'createdByName':
        sort['createdByName'] = 1;
        sort['createdOn'] = -1;
        break;
      case 'newest':
        sort['createdOn'] = -1; // descending
        break;
      case 'oldest':
        sort['createdOn'] = 1; // ascending
        break;
      default:
        sort['createdOn'] = -1; // default sort
    }
  }

  return sort;
};

async function saveAuditLog(log) {
  const db = await connectToDatabase();
  const dbResult = await db.collection('Edits').insertOne(log);
  debugDb(`Audit log saved with ID: ${dbResult.insertedId}`);
  return dbResult;
}

async function hashPassword(password) {
  try {
    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    debugDb(`Password hashed successfully`);
    return hashedPassword;
  } catch (err) {
    debugDb(`Error hashing password: ${err.message}`);
    throw new Error(`Failed to hash password: ${err.message}`);
  }
}

async function findRoleByName(roleName) {
  const db = await connectToDatabase();
  const role = await db.collection('Roles').findOne({ name: roleName });

  if (!role) {
    debugDb(`Role not found: ${roleName}`);
    throw new Error(`Role not found: ${roleName}`);
  }

  debugDb(`Role found: ${role.name}`);
  return role;
}

// Exports
export {
  connectToDatabase,
  ping,
  newId,
  GetAllUsers,
  GetUserById,
  GetUserByEmail,
  RegisterUser,
  LoginUser,
  UpdateUser,
  DeleteUser,
  GetAllBugs,
  GetBugById,
  CreateBug,
  UpdateBug,
  CloseBug,
  GetAllComments,
  getSortOptions,
  saveAuditLog,
  hashPassword,
  findRoleByName
};

// Test DB Connection
ping();