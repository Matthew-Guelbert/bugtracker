import Joi from 'joi';

export const validBody = (schema) => {
  return (req, res, next) => {
    console.log("[Validation] Incoming body:", req.body);

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, // Remove fields not in schema
    });

    if (error) {
      const messages = error.details.map(err => ({
        message: err.message,
        path: err.path,
        type: err.type,
      }));

      console.warn("[Validation] Joi errors:", messages);
      return res.status(400).json({ errors: messages });
    }

    req.body = value; // Sanitize and apply stripped version of the body
    next();
  };
};

export default validBody;