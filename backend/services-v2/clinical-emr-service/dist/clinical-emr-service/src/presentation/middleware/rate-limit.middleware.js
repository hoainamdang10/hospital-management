"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = rateLimitMiddleware;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
function rateLimitMiddleware(options) {
    return (0, express_rate_limit_1.default)(options);
}
//# sourceMappingURL=rate-limit.middleware.js.map