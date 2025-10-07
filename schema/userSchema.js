import Joi from 'joi';

// user validation
const userSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': '"Email" is required.',
    'string.email': '"Email" must be a valid email address.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': '"Password" is required.',
    'string.min': '"Password" must be at least {#limit} characters long.'
  }),
  givenName: Joi.string().min(2).required().messages({
    'string.empty': '"Given Name" is required.',
    'string.min': '"Given Name" must be at least {#limit} characters long.'
  }),
  familyName: Joi.string().min(2).required().messages({
    'string.empty': '"Family Name" is required.',
    'string.min': '"Family Name" must be at least {#limit} characters long.'
  }),
  role: Joi.alternatives().try(
    Joi.string().valid(
      'User', 'Admin', 'Developer', 'Business Analyst', 'Quality Analyst', 'Product Manager', 'Technical Manager'
    ),
    Joi.array().items(
      Joi.string().valid(
        'User', 'Admin', 'Developer', 'Business Analyst', 'Quality Analyst', 'Product Manager', 'Technical Manager'
      )
    )
  ).optional() // Allows either a string or an array of valid roles
});

// user login validation
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': '"Email" is required.',
    'string.email': '"Email" must be a valid email address.'
  }),
  password: Joi.string().required().messages({
    'any.required': '"Password" is required.',
  })
});

// user update validation
const userUpdateSchema = Joi.object({
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(), // Adjust minimum length as needed
  givenName: Joi.string().allow('', null).optional(), //testing different options
  familyName: Joi.string().allow('', null).optional(),
  role: Joi.alternatives().try(
    Joi.string().valid(
      'User', 'Admin', 'Developer', 'Business Analyst', 'Quality Analyst', 'Product Manager', 'Technical Manager'
    ),
    Joi.array().items(
      Joi.string().valid(
        'User', 'Admin', 'Developer', 'Business Analyst', 'Quality Analyst', 'Product Manager', 'Technical Manager'
      )
    )
  ).optional() // Allows either a string or an array of valid roles
});

// userId validation
const userIdSchema = Joi.string().length(24).hex().required();


export { userSchema, loginSchema, userUpdateSchema, userIdSchema };