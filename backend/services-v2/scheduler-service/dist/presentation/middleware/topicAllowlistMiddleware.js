"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetAllowlistCache = resetAllowlistCache;
exports.topicAllowlistMiddleware = topicAllowlistMiddleware;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let allowlist = null;
// For testing: reset cache
function resetAllowlistCache() {
    allowlist = null;
}
function loadAllowlist() {
    if (allowlist) {
        return allowlist;
    }
    try {
        const allowlistPath = path_1.default.join(__dirname, '../../../config/topic-allowlist.json');
        const content = fs_1.default.readFileSync(allowlistPath, 'utf-8');
        allowlist = JSON.parse(content);
        console.log('✅ Topic allowlist loaded:', allowlist?.version);
        return allowlist;
    }
    catch (error) {
        console.error('❌ Failed to load topic allowlist:', error);
        throw new Error('Topic allowlist configuration error');
    }
}
function matchesPattern(topic, pattern) {
    // Convert wildcard pattern to regex
    // Example: "appointments.*.reminder.*" -> "^appointments\\..*\\.reminder\\..*$"
    const regexPattern = pattern
        .replace(/\./g, '\\.') // Escape dots
        .replace(/\*/g, '.*'); // Replace * with .*
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(topic);
}
function isTopicAllowed(ownerService, topic) {
    const config = loadAllowlist();
    // Check if service exists in allowlist
    if (!config.allowlist[ownerService]) {
        return false;
    }
    const serviceConfig = config.allowlist[ownerService];
    // Check exact match in topics
    if (serviceConfig.topics.includes(topic)) {
        return true;
    }
    // Check wildcard patterns
    return serviceConfig.wildcards.some(pattern => matchesPattern(topic, pattern));
}
function topicAllowlistMiddleware(req, res, next) {
    try {
        // Only validate for createOrUpdateByDedup endpoint
        if (!req.body.ownerService || !req.body.topicOrCommand) {
            next();
            return;
        }
        const { ownerService, topicOrCommand } = req.body;
        if (!isTopicAllowed(ownerService, topicOrCommand)) {
            res.status(403).json({
                success: false,
                error: `Topic '${topicOrCommand}' is not allowed for service '${ownerService}'. Check topic allowlist configuration.`
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('❌ Topic allowlist middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Topic validation error'
        });
    }
}
//# sourceMappingURL=topicAllowlistMiddleware.js.map