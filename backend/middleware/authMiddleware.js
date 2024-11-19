// const jwt = require('jsonwebtoken');
// const User = require('../models/User');  // Assuming your model is in the 'models' directory
// const mongoose = require('mongoose');

// exports.protect = async (req, res, next) => {
//   try {
//     // Extract token from cookies or authorization header
//     const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

//     if (!token) {
//       return res.status(403).json({ error: 'No token provided' });
//     }

//     // Verify the token
//     jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
//       if (err) {
//         return res.status(401).json({ error: 'Invalid token' });
//       }

//       // decoded._id should be a valid ObjectId
//       if (!mongoose.Types.ObjectId.isValid(decoded._id)) {
//         return res.status(400).json({ error: 'Invalid user ID in token' });
//       }

//       // Attach userId (ObjectId) to the request object
//       req.userId = decoded._id;

//       // Optionally, you could fetch the user from the database to confirm existence and status
//       const user = await User.findById(req.userId);
//       if (!user) {
//         return res.status(404).json({ error: 'User not found' });
//       }

//       // Proceed to the next middleware or route handler
//       next();
//     });
//   } catch (error) {
//     return res.status(500).json({ error: 'An error occurred while verifying the token' });
//   }
// };

const jwt = require('jsonwebtoken');
const User = require('../models/User');  // Assuming your model is in the 'models' directory
const mongoose = require('mongoose');

exports.protect = async (req, res, next) => {
  try {
    // Extract token from cookies or authorization header
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(403).json({ error: 'No token provided' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log(decoded.user._id)
    // Validate that the decoded payload contains a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(decoded.user._id)) {
      console.log(decoded.user._id)
      return res.status(400).json({ error: 'Invalid user ID inside token' });
    }

    // Attach userId (ObjectId) to the request object
    req.userId = decoded.user._id;

    // Fetch the user from the database to confirm existence and status
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Attach user details to the request object
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'An error occurred while verifying the token' });
  }
};
