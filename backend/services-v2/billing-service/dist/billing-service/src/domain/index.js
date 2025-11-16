"use strict";
/**
 * Domain Layer Exports - Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProcessedEvent = exports.InvoiceCreatedEvent = exports.Invoice = void 0;
// Aggregates
var Invoice_1 = require("./aggregates/Invoice");
Object.defineProperty(exports, "Invoice", { enumerable: true, get: function () { return Invoice_1.Invoice; } });
// Entities (Patient is exported as type only to avoid conflict)
// export { Patient } from './entities/Patient';
// Events
var InvoiceCreatedEvent_1 = require("./events/InvoiceCreatedEvent");
Object.defineProperty(exports, "InvoiceCreatedEvent", { enumerable: true, get: function () { return InvoiceCreatedEvent_1.InvoiceCreatedEvent; } });
var PaymentProcessedEvent_1 = require("./events/PaymentProcessedEvent");
Object.defineProperty(exports, "PaymentProcessedEvent", { enumerable: true, get: function () { return PaymentProcessedEvent_1.PaymentProcessedEvent; } });
//# sourceMappingURL=index.js.map