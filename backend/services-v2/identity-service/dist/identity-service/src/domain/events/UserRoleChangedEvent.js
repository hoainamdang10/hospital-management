"use strict";
/**
 * UserRoleChangedEvent Domain Event
 * Fired when a user's role is changed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoleChangedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class UserRoleChangedEvent extends domain_event_1.DomainEvent {
    constructor(userIdVO, oldRole, newRole, changedBy) {
        super('UserRoleChanged', userIdVO.value, 'User', { oldRole: oldRole.type, newRole: newRole.type, changedBy }, 1, // eventVersion
        undefined, // correlationId
        undefined, // causationId
        userIdVO.value // userId as string for base class
        );
        this.userIdVO = userIdVO;
        this.oldRole = oldRole;
        this.newRole = newRole;
        this.changedBy = changedBy;
    }
    getEventData() {
        return {
            userId: this.userIdVO.value,
            oldRole: this.oldRole.type,
            newRole: this.newRole.type,
            changedBy: this.changedBy
        };
    }
    containsPHI() {
        return false;
    }
    getPatientId() {
        return null;
    }
}
exports.UserRoleChangedEvent = UserRoleChangedEvent;
//# sourceMappingURL=UserRoleChangedEvent.js.map