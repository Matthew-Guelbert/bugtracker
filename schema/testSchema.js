import Joi from 'joi';

// Test schema
const testSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  status: Joi.string().required().valid('Pending', 'In Progress', 'Passed', 'Failed', 'Error'),
});

// Test ID schema
const testIdSchema = Joi.string().length(24).hex().required();

// Update test schema
const testUpdateSchema = Joi.object({
  title: Joi.string().optional().allow(''),
  description: Joi.string().optional().allow(''),
  status: Joi.string().optional().valid('Pending', 'In Progress', 'Passed', 'Failed', 'Error'),
});

export { testSchema, testIdSchema, testUpdateSchema };