import express from 'express';
import { GetAllUsers, GetUserById, GetUserByEmail, RegisterUser, LoginUser, UpdateUser, DeleteUser, connect, getSortOptions, saveAuditLog, hashPassword, findRoleByName } from '../../database.js';
import { userSchema, loginSchema, userUpdateSchema, userIdSchema } from '../../schema/userSchema.js';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { validId } from '../../middleware/validId.js';
import { validBody } from '../../middleware/validBody.js';
import { isLoggedIn, fetchRoles, mergePermissions, hasPermission } from '@merlin4/express-auth';
import debug from 'debug';

const router = express.Router();
const debugUser = debug('app:UserRouter');
router.use(express.urlencoded({ extended: false }));

async function issueAuthToken(user){
  const roles = await fetchRoles(user, role => findRoleByName(role));
  const permissions = mergePermissions(user, roles);
  const token = jwt.sign({ 
    _id: user._id, 
    email: user.email, 
    role: Array.isArray(user.role) ? user.role : [user.role],
    permissions: permissions,
    name: `${user.givenName} ${user.familyName}`
  }, process.env.JWT_SECRET, { expiresIn: '1h'});

  return token;
}

async function issueAuthCookie(res, token, userId){
  const cookieOptions = { 
    httpOnly: true, 
    maxAge: 1000*60*60, 
    sameSite: 'strict', 
    secure: true
  } // 1000*60*60 = 1 hour, sameSite is for only my domain, single site. 
  res.cookie('authToken', token, cookieOptions);
}

// Login
router.post('/login', validBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await LoginUser(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Verify password
    const isPasswordValid = user.password.startsWith('$2b$') 
      ? await bcrypt.compare(password, user.password) // compare hashed password
      : password === user.password; // compare plain text password

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const jwtToken = await issueAuthToken(user);

    // Create Auth Cookie
    await issueAuthCookie(res, jwtToken, user._id);

    // Concatenate givenName and familyName to create full name for response
    const name = `${user.givenName} ${user.familyName}`;

    res.status(200).json({ message: 'User logged in successfully', name, email: user.email, role: user.role, token: jwtToken });
    debugUser(`POST /api/users/login - User: ${user._id} UserId: ${user._id} - Logged in successfully`);
  } catch (err) {
    debugUser(`POST /api/users/login - Error: ${err.message}`);
    return res.status(500).json({ message: 'Error logging in user' });
  }
});

// Get Current User Info
router.get('/me', isLoggedIn(), async (req, res) => {
  const user = await GetUserById(req.auth._id); // Fetch the user from the database
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const { _id, email, givenName, familyName, role } = user;
  const name = `${givenName} ${familyName}`;
  return res.status(200).json({ _id, email, givenName, familyName, role, name });
});

// Update Current User Info
router.patch('/me', isLoggedIn(), async (req, res) => {
  const userId = req.auth._id;
  debugUser(`PATCH /api/users/me - Request received for user ID: ${userId}`);

  try {
    // Retrieve the user using their ID
    const user = await GetUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = {};
    // Only add fields to updates if they are provided in the request body
    if (req.body.email !== undefined && req.body.email !== '') {
      updates.email = req.body.email;
    }
    if (req.body.givenName !== undefined && req.body.givenName !== '') {
      updates.givenName = req.body.givenName;
    }
    if (req.body.familyName !== undefined && req.body.familyName !== '') {
      updates.familyName = req.body.familyName;
    }
    if (req.body.password !== undefined && req.body.password !== '') {
      updates.password = await bcrypt.hash(req.body.password, 10);
    }

    // Ensure updates object is not empty
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Update the user in the database
    const updatedUser = await UpdateUser({ _id: userId, ...updates });

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    debugUser(`PATCH /api/users/me - Error: ${err.message}`);
    res.status(500).json({ message: 'An error occurred while processing your request' });
  }
});

// Get all Users 
router.get('', isLoggedIn(), async (req, res) => {
  const { keywords, role, maxAge, minAge, pageSize, pageNumber, sortBy } = req.query;

  try {
    // Check if the user is authenticated
    if (!req.auth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Call the GetAllUsers function with the query params
    const result = await GetAllUsers({
      keywords,
      role,
      maxAge,
      minAge,
      sortBy,
      pageSize,
      pageNumber
    });

    console.log(result.users);
    
    // Return the paginated response
    res.status(200).json(result);

  } catch (err) {
    console.error("Error fetching users in /api/users route:", err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

//Get User by ID
router.get("/:userId", isLoggedIn(), validId('userId'), async (req, res) => {
  const userId = req.params.userId;
  debugUser(`GET /api/users/${userId} - Request received`);

  try {
    const user = await GetUserById(userId);
    debugUser(`User found: ${JSON.stringify(user)}`);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user data without password
    const userWithoutPassword = { ...user, password: undefined };
    res.status(200).json(userWithoutPassword);
  } catch(err){
    debugUser(`Error fetching user: ${err.message}`);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

//Register User
router.post('/register', validBody(userSchema), async (req, res) => {
  const newUser = req.body;

  try {

    const existingUser = await GetUserByEmail(newUser.email);
    if (existingUser) {
      return res.status(400).json({ message: 'User\'s email already exists' });
    }

    // Hash the password before storing it
    newUser.password = await hashPassword(newUser.password);
    // FIXME: Needs to be an array of roles
    newUser.role = ['User']; // Assign default role 'User', can be updated later

    const insertUserResult = await RegisterUser(newUser);
    if (insertUserResult.acknowledged) {
      // Create a log for the registration
      const log = {
        timestamp: new Date(),
        collection: "user",
        operation: "insert",
        target: { userId: insertUserResult.insertedId },
        update: newUser
      };
      await saveAuditLog(log);

      // Generate JWT Token
      const jwtToken = await issueAuthToken({ ...newUser, _id: insertUserResult.insertedId });

      // Assign the insertedId to newUser._id
      newUser._id = insertUserResult.insertedId;

      // Create Auth Cookie
      await issueAuthCookie(res, jwtToken, newUser._id);

      // Concatenate givenName and familyName to create full name for response
      const name = `${newUser.givenName} ${newUser.familyName}`;

      res.status(201).json({
        message: 'User registered successfully',
        name,
        email: newUser.email,
        token: jwtToken
      });
    } else {
    // Log error details and request body for debugging purposes
    debugUser(`POST /api/users/register - Error: ${err.message} - Request body: ${JSON.stringify(req.body)} - Stack: ${err.stack}`);
    }
  } catch (err) {
    debugUser(`POST /api/users/register - Error: ${err.message} - Request body: ${JSON.stringify(req.body)} - Stack: ${err.stack}`);
    return res.status(500).json({ message: 'Error registering user' });
  }
});


//Update User
router.patch("/:userId", hasPermission('canEditAnyUser'), validId('userId'), validBody(userUpdateSchema), async (req, res) => {
  const userIdParam = req.params.userId;
  const currentUserId = req.auth._id; // Extract the current user ID from the auth
  const isUpdatingSelf = userIdParam === currentUserId; // Check if the user is updating their own profile
  debugUser(`PATCH /api/users/${userIdParam} - Request received`);

  try {
    debugUser(`PATCH /api/users/${userIdParam} - Attempting to fetch user by ID`);

    const user = await GetUserById(userIdParam);  // Fetch the user by ID from DB
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = {};

    // Apply updates only if fields are provided
    if (req.body.email !== undefined && req.body.email !== '') updates.email = req.body.email;
    if (req.body.password !== undefined && req.body.password !== '') {
      updates.password = await hashPassword(req.body.password);
      delete req.body.password; // Remove the old password from the request body
    }
    if (req.body.givenName !== undefined && req.body.givenName !== '') updates.givenName = req.body.givenName;
    if (req.body.familyName !== undefined && req.body.familyName !== '') updates.familyName = req.body.familyName;
    if (req.body.role !== undefined && req.body.role !== '') updates.role = req.body.role;

    // Add metadata fields if there are updates
    if (Object.keys(updates).length > 0) {
      updates.lastUpdatedOn = new Date();
      updates.lastUpdatedBy = req.auth;

      // Update the user in the database
      await UpdateUser({ ...user, ...updates });

      // Create a log for the update
      const log = {
        timestamp: new Date(),
        collection: "user",
        operation: "update",
        target: { userId: userIdParam },
        update: updates,
        auth: req.auth,
      };
      await saveAuditLog(log);

    } else {
      debugUser(`PATCH /api/users/${userIdParam} - No fields to update`);
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Issue new JWT token if updating self
    let newToken = null;
    if (isUpdatingSelf) {
      newToken = await issueAuthToken({ _id: currentUserId, email: req.auth.email, name: req.auth.name });
    }

    // Construct response
    const responseData = {
      message: 'User updated successfully',
      userId: userIdParam,
      ...(isUpdatingSelf && { authToken: newToken }),
    };

    res.status(200).json(responseData);
  } catch (err) {
    debugUser(`PATCH /api/users/${userIdParam} - Error: ${err.message}`);
    res.status(500).json({ message: 'An error occurred while processing your request' });
  }
});

//Delete User
router.delete("/:userId", hasPermission('canEditAnyUser'), validId('userId'), async (req, res) => {
  const userIdParam = req.params.userId;
  const auth = req.auth;
  debugUser(`DELETE /api/users/${userIdParam} - Request received`);

  try{
    const user = await GetUserById(userIdParam);
    if(!user){
      debugUser(`DELETE /api/users/${userIdParam} - User not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await DeleteUser(userIdParam);

    if(result.deletedCount === 0){
      debugUser(`DELETE /api/users/${userIdParam} - User not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a log for the deletion
    const log = {
      timestamp: new Date(),
      collection: "user",
      operation: "delete",
      target: { userId: userIdParam },
      auth: auth
    }
    await saveAuditLog(log);

    debugUser(`DELETE /api/users/${userIdParam} - User deleted successfully`);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    debugUser(`DELETE /api/users/${userIdParam} - Error: ${err.message}`);
    res.status(500).json({ message: `Error deleting user: ${err.message}` });
  }
});


// User.js specific functions

// Working as needed for now (no longer being used, but kept for reference)
// const getSortOptionsAlt = (sortBy) => {
//   const sort = {};
//   switch (sortBy) {
//     case 'givenName':
//       sort['givenName'] = 1; // ascending
//       sort['familyName'] = 1; // ascending
//       sort['createdOn'] = 1; // ascending
//       break;
//     case 'familyName':
//       sort['familyName'] = 1;
//       sort['givenName'] = 1;
//       sort['createdOn'] = 1;
//       break;
//     case 'role':
//       sort['role'] = 1;
//       sort['givenName'] = 1;
//       sort['familyName'] = 1;
//       sort['createdOn'] = 1;
//       break;
//     case 'newest':
//       sort['createdOn'] = -1; // descending
//       break;
//     case 'oldest':
//       sort['createdOn'] = 1; // ascending
//       break;
//     default:
//       sort['givenName'] = 1; // default to givenName
//   }
//   return sort;
// };

export { router as userRouter };