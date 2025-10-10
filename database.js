import * as dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcrypt';

import { MongoClient, ObjectId } from 'mongodb';
import debug from 'debug';
const debugDb = debug('app:Database');

/** Generate/Parse an ObjectId */
const newId = (str) => new ObjectId(str);

/** Global variable storing the open connection, do not use it directly */
let _db = null;

/** Connect to the database */
async function connect(){
  if (!_db){
    const dbUrl = process.env.DB_URL;
    const dbName = process.env.DB_NAME;
    const client = await MongoClient.connect(dbUrl);
    _db = client.db(dbName);
    debugDb('Connected to database.');
  }
  return _db;
}

/** Connect to the database and verify the connection */
// possibly comment out when deploying to gcloud
async function ping(){
  const db = await connect();
  const pong = await db.command({ping: 1});
  debugDb(`Pinging server: ${JSON.stringify(pong)}`);
}

/** FUNCTIONS **/

// User functions
// Updated GetAllUsers function to handle query, pagination, sorting, and matching
async function GetAllUsers({ keywords, role, maxAge, minAge, sortBy, pageSize = 5, pageNumber = 1 }) {
  debugDb('GetAllUsers');

  try {
    const db = await connect();
    const match = {};
    const sortOptions = getSortOptions(sortBy, 'user');  // Use your existing helper to get sorting options

    // Keywords search (partial text search)
    if (keywords) {
      match.$or = [
        { givenName: { $regex: keywords, $options: 'i' } },  // Search givenName
        { familyName: { $regex: keywords, $options: 'i' } },  // Search familyName
        { email: { $regex: keywords, $options: 'i' } }         // Search email
      ];
    }

    // Role search
    if (role) {
      match.role = role;  // Filter by user role
    }

    // Age filter (maxAge and minAge)
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Reset time to midnight

    const pastMaximumDaysOld = new Date(today);
    pastMaximumDaysOld.setDate(pastMaximumDaysOld.getDate() - maxAge);

    const pastMinimumDaysOld = new Date(today);
    pastMinimumDaysOld.setDate(pastMinimumDaysOld.getDate() - minAge);

    if (maxAge && minAge) {
      match.createdOn = { $lte: pastMinimumDaysOld, $gte: pastMaximumDaysOld }; // Between minAge and maxAge
    } else if (minAge) {
      match.createdOn = { $lte: pastMinimumDaysOld }; // Only users created within minAge days
    } else if (maxAge) {
      match.createdOn = { $gte: pastMaximumDaysOld }; // Only users created within maxAge days
    }

    // Pagination setup
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
      console.log(user.roles);
    })

    // Count the total number of users that match the search criteria
    const totalUsers = await db.collection('Users').countDocuments(match);
    const totalPages = Math.ceil(totalUsers / pageSize);

    // Return the result with pagination info
    return {
      users,
      totalUsers,
      totalPages,
      currentPage: pageNumber,
      pageSize: pageSize
    };
  
  } catch (error) {
    console.error(`Error in GetAllUsers: ${error.message}`);
    throw new Error('Error retrieving users');
  }
}


async function GetUserById(id){
  const db = await connect();

  if (!ObjectId.isValid(id)){
    return null;
  }

  try {
    const user = await db.collection('Users').findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } } // Exclude password field
    );
    return user;

  } catch(error){
    console.error(`Error in GetUserById: ${error.message}`);
    throw new Error('Error retrieving user');
  }
}

async function GetUserByEmail(email){
  const db = await connect();

  try{
    const user = await db.collection("Users").findOne({ email: email });
    return user;
  }catch(error){
    console.error(`Error in GetUserByEmail: ${error.message}`);
    throw new Error('Error retrieving user');
  }
}

async function RegisterUser(user) {
  try{
    const db = await connect();

    // Check if a user with the same email already exists
    const existingUser = await db.collection("Users").findOne({ email: user.email });
  
    if (existingUser) {
      // If the email is already in use, throw an error
      throw new Error('Email already registered');
    }

    // Generate a new ObjectId for the user and add creation date
    user._id = new ObjectId();

    // Insert the new user into the database
    const dbResult = await db.collection("Users").insertOne({
      ...user, // Spread the user object
      createdOn: new Date() // Add createdOn field
    });

    // debug message
    const userId = user._id;
    const currentDate = new Date().toISOString();

    debugDb(`User registration successful:
      - ID: ${userId}
      - Email: ${user.email}
      - Created On: ${currentDate}
      - Result: ${JSON.stringify(dbResult)}`);

    return dbResult; // Return the result from the database operation
  }catch(error){
    console.error(`Error in AddUser: ${error.message}`);
  throw new Error('Error adding user');
  }
};

async function LoginUser(email) {
  try{
    const db = await connect();
    const user = await db.collection("Users").findOne({ email });
    return user;
  }catch(error){
    console.error(`Error in LoginUser: ${error.message}`);
    throw new Error('Error logging in user');
  }
};

async function UpdateUser(updatedUser) {
  try {
    const db = await connect();
    const { _id, ...updateFields } = updatedUser; // Exclude _id from the fields to be updated
    const dbResult = await db.collection("Users").updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateFields } // Ensure updatedUser is an object with the fields to update
    );
    console.log(`User updated in database: ${JSON.stringify(dbResult)}`);
    return dbResult;
  } catch (error) {
    console.error(`Error in UpdateUser: ${error.message}`);
    throw new Error('Error updating user');
  }
}

async function DeleteUser(id) {
  debugDb('DeleteUser initiated for ID: ' + id);
  try{
    const db = await connect();
    const dbResult = await db.collection("Users").deleteOne({ _id: new ObjectId(id) });
    debugDb(`DeleteUser: ${JSON.stringify(dbResult)}`);
    return dbResult;
  }catch(error){
    console.error(`Error in DeleteUser: ${error.message}`);
    throw new Error('Error deleting user');
  }
};

// Bug functions
async function GetAllBugs(match = {}, sortOptions = {}, pageSize = 10, pageNumber = 1) {
  debugDb('GetAllBugs');
  try {
    const db = await connect();
    pageNumber = parseInt(pageNumber) || 1;
    pageSize = parseInt(pageSize) || 10;
    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    const pipeline = [
      { $match: match },
      ...Object.keys(sortOptions).length ? [{ $sort: sortOptions }] : [],
      { $skip: skip },
      { $limit: limit }
    ];

    const cursor = db.collection('Bugs').aggregate(pipeline);
    const bugs = await cursor.toArray();
    const totalBugs = await db.collection('Bugs').countDocuments(match);
    const totalPages = Math.ceil(totalBugs / pageSize);

    return {
      bugs,
      totalBugs,
      totalPages,
      currentPage: pageNumber,
      pageSize: pageSize
    };
  } catch (error) {
    console.error(`Error in GetAllBugs: ${error.message}`);
    throw new Error('Error retrieving bugs');
  }
}

async function GetBugById(id){
  try{
    const db = await connect();

    const bug = await db.collection("Bugs").findOne({ _id: new ObjectId(id) });
    return bug;
  }catch(error){
    console.error(`Error in GetBugById: ${error.message}`);
    throw new Error('Error retrieving bug');
  }
};

async function AddBug(bug) {
  try{
    const db = await connect();
    const dbResult = await db.collection("Bugs").insertOne(bug);
    debugDb(`AddBug: ${JSON.stringify(dbResult)}`);

    // Generate a new ObjectId for the bug and add creation date
    //bug._id = dbResult.insertedId;
    //bug.createdOn = new Date();

    return dbResult;
  }catch(error){
    console.error(`Error in AddBug: ${error.message}`);
    throw new Error('Error adding bug');
  }
};

//FIXME: Refactor to add comments to existing bugs
async function UpdateBug(bugId, update) {
  const db = await connect();

  try{
    const dbResult = await db.collection("Bugs").updateOne(
      { _id: new ObjectId(bugId) },
      update
    );

    return dbResult;
  }catch(err){
    console.error(`Error in UpdateBug: ${err.message}`);
    throw new Error('Error updating bug'); 
  }
};

async function ClassifyBug(bugId, updatedFields) {
  debugDb('ClassifyBug');
  try{
    const db = await connect();
  
    // Update the bug document in the database
    const dbResult = await db.collection("Bugs").updateOne(
      { _id: new ObjectId(bugId) }, 
      { $set: updatedFields } 
    );
  
    debugDb(`ClassifyBug: ${JSON.stringify(dbResult)}`);
    return dbResult;
  }catch(error){
    console.error(`Error in ClassifyBug: ${error.message}`);
    throw new Error('Error classifying bug');
  }
};

async function AssignBug(bugId, updatedFields) {
  debugDb('AssignBug');
  try{
    const db = await connect();
    const dbResult = await db.collection("Bugs").updateOne(
      { _id: new ObjectId(bugId) }, 
      { $set: updatedFields } 
    );
    debugDb(`AssignBug: ${JSON.stringify(dbResult)}`);
    return dbResult;
  }catch(error){
    console.error(`Error in AssignBug: ${error.message}`);
    throw new Error('Error assigning bug');
  }
};

async function CloseBug(bugId, updatedFields) {
  debugDb('CloseBug');
  try{
    const db = await connect();

    // Update the bug document in the database
    const dbResult = await db.collection("Bugs").updateOne(
        { _id: new ObjectId(bugId) },
        { $set: updatedFields }
    );

    debugDb(`CloseBug: ${JSON.stringify(dbResult)}`);
    return dbResult;
  }catch(error){
    console.error(`Error in CloseBug: ${error.message}`);
    throw new Error('Error closing bug');
  }
};

// Comment functions
async function GetAllComments(){
  debugDb('GetAllComments');
  const db = await connect();
  try{
    const comments = await db.collection("Comments").find({}).toArray();
    debugDb(`Fetched ${comments.length} comments`);
    return comments;
  }catch(error){
    console.error(`Error in GetAllComments: ${error.message}`);
    throw new Error('Error retrieving comments');
  }
};

async function GetCommentById(id){
  debugDb('GetCommentById');
  const db = await connect();

  try{
    if (!ObjectId.isValid(id)){
      return null;
    }

    const comment = await db.collection("Comments").findOne({ _id: new ObjectId(id) });
    debugDb(`Fetched comment: ${JSON.stringify(comment)}`);
    return comment;
  }catch(error){
    console.error(`Error in GetCommentById: ${error.message}`);
    throw new Error('Error retrieving comment');
  }
};

//FIXME: Refactor for inserting new comments to an existing bug, or disable this function
async function AddComment(comment){
  debugDb('AddComment');
  const db = await connect();

  try{
    const dbResult = await db.collection("Comments").insertOne(comment);
    debugDb(`Comment added with ID: ${dbResult.insertedId}`);
    return dbResult;
  }catch(error){
    console.error(`Error in AddComment: ${error.message}`);
    throw new Error('Error adding comment');
  }
};

// Test Case functions
async function GetAllTests() {
  debugDb('GetAllTests');
  const db = await connect();
  try{
    const tests = await db.collection("Tests").find({}).toArray();
    debugDb(`Fetched ${tests.length} tests`);
    return tests;
  }catch(error){
    console.error(`Error in GetAllTests: ${error.message}`);
    throw new Error('Error retrieving tests');
  }
};

async function GetTestById(id){
  debugDb('GetTestById');
  const db = await connect();
  
  try{
    const test = await db.collection("Tests").findOne({ _id: new ObjectId(id) });
    debugDb(`Fetched test: ${JSON.stringify(test)}`);
    return test;
  }catch(error){
    console.error(`Error in GetTestById: ${error.message}`);
    throw new Error('Error retrieving test');
  }
};

async function AddTest(test){
  debugDb('AddTest');
  const db = await connect();

  try{
    const dbResult = await db.collection("Tests").insertOne(test);
    debugDb(`Test added with ID: ${dbResult.insertedId}`);
    return dbResult;
  }catch(error){
    console.error(`Error in AddTest: ${error.message}`);
    throw new Error('Error adding test');
  }
};

async function UpdateTest(updatedTest){
  const db = await connect();
  const dbResult = await db.collection("Tests").updateOne(
    { _id: new ObjectId(updatedTest._id) }, 
    { $set: updatedTest }
  );
  debugDb(`UpdateTest: ${JSON.stringify(dbResult)}`);
  return dbResult;
}

async function DeleteTest(id){
  debugDb('DeleteTest initiated for ID: ' + id);
  const db = await connect();
  const dbResult = await db.collection("Tests").deleteOne({ _id: new ObjectId(id) });
  debugDb(`DeleteTest: ${JSON.stringify(dbResult)}`);
  return dbResult;
};

// Universal functions for user.js and bug.js

function getSortOptions(sortBy, type){
  const sort = {};

  if (type === 'user'){
    switch (sortBy){
      case 'givenName':
        sort['givenName'] = 1; // ascending
        sort['familyName'] = 1; // ascending
        sort['createdOn'] = 1; // ascending
        break;
      case 'familyName':
        sort['familyName'] = 1;
        sort['givenName'] = 1;
        sort['createdOn'] = 1;
        break;
      case 'role':
        sort['role'] = 1;
        sort['givenName'] = 1;
        sort['familyName'] = 1;
        sort['createdOn'] = 1;
        break;
      case 'newest':
        sort['createdOn'] = -1; // descending
        break;
      case 'oldest':
        sort['createdOn'] = 1; // ascending
        break;
      default:
        sort['givenName'] = 1; // default sort
    }
  } else if (type === 'bug'){
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

async function saveAuditLog(log){
  const db = await connect();
  const dbResult = await db.collection("Edits").insertOne(log);
  return dbResult;
}

async function hashPassword(password){
  try{
    const saltRounds = 10; //adjust as necessary, 10 is a good default
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch(error){
    console.error(`Error in hashPassword: ${error.message}`);
    throw new Error('Error hashing password');
  }
}

async function findRoleByName(roleName){
  const db = await connect();
  const role = await db.collection("Roles").findOne({ name: roleName });
  return role;
}

/** export functions */
export { newId, connect, ping, GetAllUsers, GetUserById, GetUserByEmail, RegisterUser, LoginUser, UpdateUser, DeleteUser, 
         GetAllBugs, GetBugById, AddBug, UpdateBug, ClassifyBug, AssignBug, CloseBug, 
         GetAllComments, GetCommentById, AddComment, 
         GetAllTests, GetTestById, AddTest, UpdateTest, DeleteTest, 
         getSortOptions, saveAuditLog, hashPassword, findRoleByName }; 

/** test database connection */
ping();