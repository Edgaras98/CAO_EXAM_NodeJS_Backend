const jwt = require('jsonwebtoken');
const { jswtSecret } = require('./config');

module.exports = {
  isLoggedin: (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const decodedToken = jwt.verify(token, jswtSecret);
      req.userData = decodedToken;
      return next();
    } catch (err) {
      res.status(401).send({ err: 'failed to authorize' });
    }
  },
};
