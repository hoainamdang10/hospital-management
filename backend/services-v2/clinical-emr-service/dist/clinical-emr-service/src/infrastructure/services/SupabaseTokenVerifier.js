"use strict";
/**
 * SupabaseTokenVerifier - JWT Token Verification Implementation
 * Verifies JWT tokens using Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Security
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseTokenVerifier = void 0;
const inversify_1 = require("inversify");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ILogger_1 = require("../../application/services/ILogger");
const types_1 = require("../di/types");
let SupabaseTokenVerifier = class SupabaseTokenVerifier {
    constructor(logger) {
        this.logger = logger;
        this.jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || '';
        if (!this.jwtSecret) {
            throw new Error('JWT_SECRET or SUPABASE_JWT_SECRET must be configured');
        }
    }
    async verifyToken(token) {
        try {
            // Verify JWT signature
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            // Extract user information
            const payload = {
                id: decoded.sub || decoded.user_id || decoded.id,
                email: decoded.email,
                role: decoded.role || decoded.user_role,
                sessionId: decoded.session_id || decoded.sid || decoded.sessionId,
                exp: decoded.exp,
                iat: decoded.iat
            };
            // Validate required fields
            if (!payload.id) {
                this.logger.warn('Token missing user ID', { decoded });
                return null;
            }
            // Check if token is expired
            if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
                this.logger.warn('Token expired', { userId: payload.id });
                return null;
            }
            return payload;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                this.logger.warn('Token expired', { error: error.message });
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                this.logger.warn('Invalid token', { error: error.message });
            }
            else {
                this.logger.error('Token verification failed', { error });
            }
            return null;
        }
    }
};
exports.SupabaseTokenVerifier = SupabaseTokenVerifier;
exports.SupabaseTokenVerifier = SupabaseTokenVerifier = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.Logger)),
    __metadata("design:paramtypes", [typeof (_a = typeof ILogger_1.ILogger !== "undefined" && ILogger_1.ILogger) === "function" ? _a : Object])
], SupabaseTokenVerifier);
//# sourceMappingURL=SupabaseTokenVerifier.js.map