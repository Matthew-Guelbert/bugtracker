import Joi from 'joi';

export const validBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const messages = error.details.map(err => ({
        message: err.message,
        path: err.path,  // Show specific path Joi flagged
        type: err.type,  // Show error type (optional but useful for debugging)
      }));
      console.error("Joi validation errors:", messages);  // Detailed error logging
      return res.status(400).json({ error: messages });
    }
    next();
  };
};
