"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIdentityToken = registerIdentityToken;
exports.ensureIdentityMockServer = ensureIdentityMockServer;
const express_1 = __importDefault(require("express"));
const tokenRegistry = new Map();
let server = null;
let baseUrl = null;
let referenceCount = 0;
function registerIdentityToken(token, payload) {
    tokenRegistry.set(token, payload);
}
async function ensureIdentityMockServer() {
    if (server && baseUrl) {
        referenceCount++;
        return {
            url: baseUrl,
            release: async () => {
                referenceCount = Math.max(referenceCount - 1, 0);
                if (referenceCount === 0 && server) {
                    await new Promise(resolve => server.close(() => resolve()));
                    server = null;
                    baseUrl = null;
                    // Don't clear tokenRegistry here - tokens may still be needed
                }
            }
        };
    }
    const app = (0, express_1.default)();
    app.get('/auth/verify', (req, res) => {
        const authHeader = req.header('authorization') || req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[MockIdentity] Missing bearer token');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Missing bearer token'
            });
        }
        const token = authHeader.substring(7);
        const payload = tokenRegistry.get(token);
        if (!payload) {
            console.log(`[MockIdentity] Invalid token: ${token.substring(0, 20)}... (Registry size: ${tokenRegistry.size})`);
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }
        console.log(`[MockIdentity] Token verified for user: ${payload.email} (roles: ${payload.roles.join(', ')})`);
        return res.json({
            success: true,
            data: {
                userId: payload.userId,
                email: payload.email,
                roles: payload.roles,
                permissions: payload.permissions,
                sessionId: `mock-session-${payload.userId}`
            }
        });
    });
    server = await new Promise(resolve => {
        const instance = app.listen(0, () => resolve(instance));
    });
    const addressInfo = server.address();
    baseUrl = `http://127.0.0.1:${addressInfo.port}`;
    referenceCount = 1;
    return {
        url: baseUrl,
        release: async () => {
            referenceCount = Math.max(referenceCount - 1, 0);
            if (referenceCount === 0 && server) {
                await new Promise(resolve => server.close(() => resolve()));
                server = null;
                baseUrl = null;
                // Don't clear tokenRegistry here - tokens may still be needed
            }
        }
    };
}
//# sourceMappingURL=identityMockServer.js.map