"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({
                success: false,
                error: 'Missing authorization header'
            });
            return;
        }
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Missing token'
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
        if (!jwtSecret) {
            console.error('❌ JWT_SECRET not configured');
            res.status(500).json({
                success: false,
                error: 'Server configuration error'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('❌ Auth middleware error:', error);
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
        else {
            res.status(401).json({
                success: false,
                error: 'Authentication failed'
            });
        }
    }
}
//# sourceMappingURL=authMiddleware.js.map