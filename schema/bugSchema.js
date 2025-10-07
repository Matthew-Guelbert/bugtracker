import Joi from 'joi';

// Bug schema
const bugSchema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'Title is required',
    'string.empty': 'Title cannot be empty'
  }),
  description: Joi.string().required().messages({
    'any.required': 'Description is required',
    'string.empty': 'Description cannot be empty'
  }),
  stepsToReproduce: Joi.string().required().messages({
    'any.required': 'Steps to reproduce are required',
    'string.empty': 'Steps to reproduce cannot be empty'
  }),
  author: Joi.string().required().messages({
    'any.required': 'Author is required',
    'string.empty': 'Author cannot be empty'
  }),
  timeLogs: Joi.array().items(
    Joi.object({
      hours: Joi.number().required().min(0.1),
      version: Joi.string().required(),
      dateFixed: Joi.date().required(),
      notes: Joi.string().optional().allow(''),
      loggedBy: Joi.string().required(),
      loggedOn: Joi.date().default(() => new Date())
    })
  ).optional() // Allow the timeLogs array to be omitted or empty
});

// Bug ID schema
const bugIdSchema = Joi.object({
  bugId: Joi.string().length(24).required(),
});

// Update bug schema
const bugUpdateSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  stepsToReproduce: Joi.string().optional(),
}).unknown(true); // Allow other fields to be updated

// Assign bug schema
const assignBugSchema = Joi.object({
  assignedToUserId: Joi.string().required(),
  assignedToUserName: Joi.string().required(),
});

// Classify bug schema
const classifyBugSchema = Joi.object({
  classification: Joi.string().required().messages({
    'any.required': 'Classification is required',
    'string.empty': 'Classification cannot be empty'
  })
});

// Close bug schema
const closeBugSchema = Joi.object({
  closed: Joi.boolean().required(),
});

// Log hours schema
const logHoursSchema = Joi.object({
  hours: Joi.number().required().min(0.1).messages({
    'any.required': 'Hours are required',
    'number.min': 'Hours must be at least 0.1'
  }),
  version: Joi.string().required().messages({
    'any.required': 'Version is required',
    'string.empty': 'Version cannot be empty'
  }),
  dateFixed: Joi.date().required().messages({
    'any.required': 'Date fixed is required',
    'date.base': 'Date fixed must be a valid date'
  }),
  notes: Joi.string().optional().allow('').messages({
    'string.empty': 'Notes cannot be empty'
  })
});

export { bugSchema, bugIdSchema, bugUpdateSchema, assignBugSchema, classifyBugSchema, closeBugSchema, logHoursSchema };
