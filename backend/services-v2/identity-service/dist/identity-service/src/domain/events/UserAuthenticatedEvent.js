"use strict";
/**
 * UserAuthenticatedEvent Domain Event
 * Fired when a user successfully authenticates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAuthenticatedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class UserAuthenticatedEvent extends domain_event_1.DomainEvent {
    constructor(userIdVO, ipAddress, userAgent, timestamp) {
        super('UserAuthenticated', userIdVO.value, 'User', { ipAddress, userAgent, timestamp }, 1, // eventVersion
        undefined, // correlationId
        undefined, // causationId
        userIdVO.value // userId as string for base class
        );
        this.userIdVO = userIdVO;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.timestamp = timestamp;
    }
    getEventData() {
        return {
            userId: this.userIdVO.value,
            ipAddress: this.ipAddress,
            userAgent: this.userAgent,
            timestamp: this.timestamp
        };
    }
    containsPHI() {
        return false; // IP and user agent are not PHI
    }
    getPatientId() {
        return null;
    }
}
exports.UserAuthenticatedEvent = UserAuthenticatedEvent;
//# sourceMappingURL=UserAuthenticatedEvent.js.map