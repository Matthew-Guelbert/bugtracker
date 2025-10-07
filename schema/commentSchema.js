import Joi from 'joi';

const commentSchema = Joi.object({
  //author: Joi.string().required(),
  text: Joi.string().required(),
});

export { commentSchema };