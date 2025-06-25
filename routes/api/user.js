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


// Login user
router.post('/login', validBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await LoginUser(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.'});
    }

    // Verify password
    const isPasswordValid = user.password.startsWith('$2b$')
      ? await bcrypt.compare(password, user.password) // compares hashed password
      : user.password === password; // plain text password

    if (!isPasswordValid) {
      return.res.status(4010.json({ message: 'Invalid email or password.'}))
    }
  }
})
