"use strict";
/**
 * ListActiveSessionsUseCase
 * Use case for listing all active sessions for a user
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListActiveSessionsUseCase = void 0;
class ListActiveSessionsUseCase {
    constructor(sessionRepository, logger) {
        this.sessionRepository = sessionRepository;
        this.logger = logger;
    }
    async execute(request) {
        try {
            // Validate input
            if (!request.userId) {
                throw new Error("User ID is required");
            }
            let resolvedCurrentSessionId = request.currentSessionId;
            // Resolve current session by access token when needed
            if (!resolvedCurrentSessionId && request.accessToken) {
                const session = await this.sessionRepository.findByToken(request.accessToken);
                if (session && session.userId === request.userId) {
                    resolvedCurrentSessionId = session.id;
                }
                else {
                    this.logger.warn("Unable to resolve current session from access token", {
                        userId: request.userId,
                        reason: session ? "token_user_mismatch" : "session_not_found",
                    });
                }
            }
            // Get all active sessions for the user
            const sessions = await this.sessionRepository.findActiveSessionsByUserId(request.userId);
            // Map to response format
            const sessionInfos = sessions.map((session) => ({
                sessionId: session.id,
                deviceInfo: this.parseDeviceInfo(session.deviceInfo, session.userAgent),
                ipAddress: session.ipAddress,
                location: this.getLocationFromIP(session.ipAddress),
                lastActivity: session.lastAccessedAt,
                createdAt: session.createdAt,
                isCurrent: session.id === resolvedCurrentSessionId,
                expiresAt: session.expiresAt,
            }));
            return {
                success: true,
                sessions: sessionInfos,
                totalCount: sessionInfos.length,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error("Error listing active sessions", {
                error: errorMessage,
                userId: request.userId,
            });
            throw new Error(`Failed to list active sessions: ${errorMessage}`);
        }
    }
    /**
     * Parse device info from stored data and user agent
     */
    parseDeviceInfo(deviceInfo, userAgent) {
        // If deviceInfo is already parsed and has valid data, return it
        if (deviceInfo &&
            typeof deviceInfo === "object" &&
            Object.keys(deviceInfo).length > 0) {
            // Check if it has at least one valid property
            const hasValidData = deviceInfo.platform ||
                deviceInfo.browser ||
                deviceInfo.os ||
                deviceInfo.deviceType;
            if (hasValidData) {
                return {
                    platform: deviceInfo.platform || "Unknown",
                    browser: deviceInfo.browser || "Unknown",
                    os: deviceInfo.os || "Unknown",
                    deviceType: deviceInfo.deviceType || "Unknown",
                };
            }
        }
        // Otherwise, parse from user agent (basic parsing)
        return this.parseUserAgent(userAgent);
    }
    /**
     * Basic user agent parsing
     */
    parseUserAgent(userAgent) {
        if (!userAgent) {
            return {
                platform: "Unknown",
                browser: "Unknown",
                os: "Unknown",
                deviceType: "Unknown",
            };
        }
        // Detect OS (check iOS before Mac since iOS user agents contain "Mac")
        let os = "Unknown";
        if (userAgent.includes("Windows"))
            os = "Windows";
        else if (userAgent.includes("Android"))
            os = "Android";
        else if (userAgent.includes("iOS") ||
            userAgent.includes("iPhone") ||
            userAgent.includes("iPad"))
            os = "iOS";
        else if (userAgent.includes("Mac"))
            os = "macOS";
        else if (userAgent.includes("Linux"))
            os = "Linux";
        // Detect browser
        let browser = "Unknown";
        if (userAgent.includes("Chrome"))
            browser = "Chrome";
        else if (userAgent.includes("Firefox"))
            browser = "Firefox";
        else if (userAgent.includes("Safari"))
            browser = "Safari";
        else if (userAgent.includes("Edge"))
            browser = "Edge";
        else if (userAgent.includes("Opera"))
            browser = "Opera";
        // Detect device type
        let deviceType = "Desktop";
        if (userAgent.includes("Mobile"))
            deviceType = "Mobile";
        else if (userAgent.includes("Tablet"))
            deviceType = "Tablet";
        return {
            platform: os,
            browser,
            os,
            deviceType,
        };
    }
    /**
     * Get location from IP address (placeholder)
     * In production, use a geolocation service
     */
    getLocationFromIP(ipAddress) {
        // Placeholder implementation
        // In production, integrate with a geolocation service like MaxMind or IP2Location
        if (ipAddress.startsWith("127.") || ipAddress === "::1") {
            return "Localhost";
        }
        return "Unknown Location";
    }
}
exports.ListActiveSessionsUseCase = ListActiveSessionsUseCase;
//# sourceMappingURL=ListActiveSessionsUseCase.js.map