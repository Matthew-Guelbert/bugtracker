export const validRole = (requiredRoles) => {
  return (req, res, next) => {
    const userRole = req.userRole;

    if (!userRole) {
      return res.status(401).json({ error: 'Unauthorized: User role not found.' });
    }

    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: `Forbidden: Your role (${userRole}) does not have permission. Required roles: ${requiredRoles.join(', ')}.` 
      });
    }

    next();
  };
};
