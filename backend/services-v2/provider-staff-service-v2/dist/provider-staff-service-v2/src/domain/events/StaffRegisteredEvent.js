"use strict";
/**
 * StaffRegisteredEvent
 * Domain event fired when a new staff member is registered
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffRegisteredEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class StaffRegisteredEvent extends domain_event_1.DomainEvent {
    constructor(staffIdVO, staffType, fullName) {
        super('StaffRegistered', staffIdVO.value, 'ProviderStaff', { staffType, fullName }, 1, // eventVersion
        undefined, // correlationId
        undefined, // causationId
        staffIdVO.value // userId as string for base class
        );
        this.staffIdVO = staffIdVO;
        this.staffType = staffType;
        this.fullName = fullName;
    }
    getEventData() {
        return {
            staffId: this.staffIdVO.value,
            staffType: this.staffType,
            fullName: this.fullName
        };
    }
    containsPHI() {
        return true; // Contains personal information
    }
    getPatientId() {
        return null; // Staff is not a patient
    }
}
exports.StaffRegisteredEvent = StaffRegisteredEvent;
//# sourceMappingURL=StaffRegisteredEvent.js.map