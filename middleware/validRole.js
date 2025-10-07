export const validRole = (requiredRoles) => {
  return (req, res, next) => {
    const userRole = req.userRole; // Get user role from the request

    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: You do not have the necessary permissions.' });
    }

    next(); // User has the correct role, proceed to the next middleware
  };
};