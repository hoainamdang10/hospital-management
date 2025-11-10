"use strict";
/**
 * IOutboxRepository - Domain Layer
 * Repository interface for Transactional Outbox Pattern
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Transactional Outbox Pattern, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxEventStatus = void 0;
/**
 * Outbox Event Status
 */
var OutboxEventStatus;
(function (OutboxEventStatus) {
    OutboxEventStatus["PENDING"] = "PENDING";
    OutboxEventStatus["PUBLISHED"] = "PUBLISHED";
    OutboxEventStatus["FAILED"] = "FAILED";
})(OutboxEventStatus || (exports.OutboxEventStatus = OutboxEventStatus = {}));
//# sourceMappingURL=IOutboxRepository.js.map