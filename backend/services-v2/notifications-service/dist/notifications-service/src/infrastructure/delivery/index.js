"use strict";
/**
 * Delivery Infrastructure - Export all delivery components
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
exports.DeliveryServiceFactory = exports.MultiChannelDeliveryService = void 0;
var MultiChannelDeliveryService_1 = require("./MultiChannelDeliveryService");
Object.defineProperty(exports, "MultiChannelDeliveryService", { enumerable: true, get: function () { return MultiChannelDeliveryService_1.MultiChannelDeliveryService; } });
var DeliveryServiceFactory_1 = require("./DeliveryServiceFactory");
Object.defineProperty(exports, "DeliveryServiceFactory", { enumerable: true, get: function () { return DeliveryServiceFactory_1.DeliveryServiceFactory; } });
__exportStar(require("./providers"), exports);
//# sourceMappingURL=index.js.map