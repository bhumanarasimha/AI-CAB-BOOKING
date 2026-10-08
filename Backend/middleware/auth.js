const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');

  // Support optional multi-user override header for testing / development
  const customEmail = req.header('X-User-Email');
  const customId = req.header('X-User-Id');
  const customName = req.header('X-User-Name');

  if (!authHeader) {
    if (customEmail || customId) {
      req.user = {
        id: customId || (customEmail ? customEmail : '000000000000000000000002'),
        email: (customEmail || '').toLowerCase().trim(),
        name: customName || (customEmail ? customEmail.split('@')[0] : 'User')
      };
      return next();
    }

    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Token format: "Bearer <token>"
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartride_jwt_secret_key');
    if (decoded && decoded.user) {
      req.user = {
        id: decoded.user.id || decoded.user._id,
        email: decoded.user.email ? decoded.user.email.toLowerCase().trim() : '',
        name: decoded.user.name || ''
      };
      req.token = token;
      return next();
    }
    return res.status(401).json({ msg: 'Invalid token structure' });
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid or has expired' });
  }
};

