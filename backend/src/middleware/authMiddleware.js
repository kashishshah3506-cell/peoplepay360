const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Splits "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied.' });
    }

    try {
        // 2. Verify token using the exact same fallback secret we put in the controller
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'peoplepay360_super_secret_fallback_key');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is invalid or expired.' });
    }
};

// 3. EXPLICITLY EXPORT THE FUNCTION
module.exports = authMiddleware;
