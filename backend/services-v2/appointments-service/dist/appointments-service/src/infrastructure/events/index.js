"use strict";
/**
 * Events Infrastructure - Exports
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentEventConsumer = exports.StaffEventConsumer = void 0;
// Specific exports to avoid conflicts
var StaffEventConsumer_1 = require("./StaffEventConsumer");
Object.defineProperty(exports, "StaffEventConsumer", { enumerable: true, get: function () { return StaffEventConsumer_1.StaffEventConsumer; } });
var DepartmentEventConsumer_1 = require("./DepartmentEventConsumer");
Object.defineProperty(exports, "DepartmentEventConsumer", { enumerable: true, get: function () { return DepartmentEventConsumer_1.DepartmentEventConsumer; } });
// ===== ARCHIVED FOR POST-MVP: Non-operational Event Consumers =====
// export * from './BillingEventConsumer'; // REMOVED FOR MVP - Billing service incomplete
// export * from './ClinicalEMREventConsumer'; // REMOVED FOR MVP
__exportStar(require("./EventBusAdapter"), exports);
__exportStar(require("./EventHandlers"), exports);
__exportStar(require("./EventSubscriptions"), exports);
//# sourceMappingURL=index.js.map