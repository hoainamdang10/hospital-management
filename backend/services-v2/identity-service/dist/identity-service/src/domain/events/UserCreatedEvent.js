"use strict";
/**
 * UserCreatedEvent Domain Event
 * Fired when a new user is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCreatedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class UserCreatedEvent extends domain_event_1.DomainEvent {
    constructor(userIdVO, userEmail, userRole, personalInfo // Optional for backward compatibility
    ) {
        super('UserCreated', userIdVO.value, 'User', { email: userEmail.value, role: userRole.type }, 1, // eventVersion
        undefined, // correlationId
        undefined, // causationId
        userIdVO.value // userId as string for base class
        );
        this.userIdVO = userIdVO;
        this.userEmail = userEmail;
        this.userRole = userRole;
        this.personalInfo = personalInfo;
    }
    getEventData() {
        return {
            userId: this.userIdVO.value,
            email: this.userEmail.value,
            role: this.userRole.type,
            personalInfo: this.personalInfo ? {
                fullName: this.personalInfo.fullName,
                phoneNumber: this.personalInfo.phoneNumber,
                address: this.personalInfo.address,
                dateOfBirth: this.personalInfo.dateOfBirth,
                gender: this.personalInfo.gender,
                citizenId: this.personalInfo.citizenId
            } : undefined
        };
    }
    containsPHI() {
        return true; // Contains email which is PHI
    }
    getPatientId() {
        return null; // User is not a patient
    }
}
exports.UserCreatedEvent = UserCreatedEvent;
//# sourceMappingURL=UserCreatedEvent.js.map