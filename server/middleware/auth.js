// ============================================================
// server/middleware/auth.js
// JWT Authentication Middleware
// ============================================================
// WHY: Protected routes (like creating rooms, sending messages)
// require the user to be logged in. This middleware checks if
// the JWT token in the request is valid before allowing access.
//
// HOW IT WORKS:
// 1. Client sends a request with "Authorization: Bearer <token>"
// 2. We extract the token from the header
// 3. We verify it with our secret key
// 4. If valid, we attach the user info to req.user and continue
// 5. If invalid, we return a 401 Unauthorized error
// ============================================================

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  try {
    // Get the Authorization header (e.g., "Bearer eyJhbGciOi...")
    const authHeader = req.headers.authorization;

    // Check if the header exists and starts with "Bearer"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Please log in.' });
    }

    // Extract the token part after "Bearer "
    const token = authHeader.split(' ')[1];

    // Verify the token using our secret key
    // If the token is tampered with or expired, this throws an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user info to the request object
    // Now any route using this middleware can access req.user
    req.user = decoded;

    // Move on to the actual route handler
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};

module.exports = protect;
