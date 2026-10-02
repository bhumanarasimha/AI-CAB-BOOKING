const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');

  const defaultUser = {
    id: '65f0a1b2c3d4e5f6a7b8c9d0',
    email: 'bhumanarasimha25@gmail.com',
    name: 'Bhumana Narasimha'
  };

  if (!authHeader) {
    req.user = defaultUser;
    return next();
  }

  // Token format: "Bearer <token>"
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartride_jwt_secret_key');
    req.user = decoded.user || defaultUser;
    next();
  } catch (err) {
    req.user = defaultUser;
    next();
  }
};

