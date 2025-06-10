import { ObjectId } from 'mongodb';

const validId = (paramName) => {
  return (req, res, next) => {
    try {
      req.params[paramName] = new ObjectId(req.params[paramName]);
      next();
    } catch (err) {
      return res.status(400).json({ error: `${paramName} is not a valid ObjectId` });
    }
  };
};

export default validId;
