import Joi from 'joi';

// User Registration Schema
const userSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).trim().required().messages({
    'string.empty': '"Email" is required.',
    'string.email': '"Email" must be a valid email address.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': '"Password" is required.',
    'string.min': '"Password" must be at least {#limit} characters long.'
  }),
  givenName: Joi.string().min(2).trim().required().messages({
    'string.empty': '"Given Name" is required.',
    'string.min': '"Given Name" must be at least {#limit} characters long.'
  }),
  familyName: Joi.string().min(2).trim().required().messages({
    'string.empty': '"Family Name" is required.',
    'string.min': '"Family Name" must be at least {#limit} characters long.'
  }),
  role: Joi.string().valid(
    'User', 'Admin', 'Developer', 'Business Analyst', 'Quality Analyst', 'Product Manager', 'Technical Manager'
  ).default('User')
});

// Login Schema
const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).trim().required().messages({
    'string.empty': 'Email is required.',
    'string.email': 'Email must be a valid email address.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required.',
    'string.min': 'Password must be at least {#limit} characters long.'
  })
});

// User Update Schema
const userUpdateSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).trim().optional(),
  password: Joi.string().min(6).optional(),
  givenName: Joi.string().min(2).trim().optional(),
  familyName: Joi.string().min(2).trim().optional(),
  role: Joi.string().valid(
  'User', 'Admin', 'Developer', 'Business Analyst', 'Quality Analyst', 'Product Manager', 'Technical Manager'
).optional()

});

// ObjectId Schema (e.g., for userId or any Mongo _id)
const userIdSchema = Joi.string().length(24).hex().required();

export { userSchema, loginSchema, userUpdateSchema, userIdSchema };
