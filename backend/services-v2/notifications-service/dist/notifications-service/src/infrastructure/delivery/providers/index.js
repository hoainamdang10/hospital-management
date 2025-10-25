"use strict";
/**
 * Channel Providers - Export all delivery providers
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InAppProvider = exports.VoiceProvider = exports.PushProvider = exports.SMSProvider = exports.EmailProvider = void 0;
var EmailProvider_1 = require("./EmailProvider");
Object.defineProperty(exports, "EmailProvider", { enumerable: true, get: function () { return EmailProvider_1.EmailProvider; } });
var SMSProvider_1 = require("./SMSProvider");
Object.defineProperty(exports, "SMSProvider", { enumerable: true, get: function () { return SMSProvider_1.SMSProvider; } });
var PushProvider_1 = require("./PushProvider");
Object.defineProperty(exports, "PushProvider", { enumerable: true, get: function () { return PushProvider_1.PushProvider; } });
var VoiceProvider_1 = require("./VoiceProvider");
Object.defineProperty(exports, "VoiceProvider", { enumerable: true, get: function () { return VoiceProvider_1.VoiceProvider; } });
var InAppProvider_1 = require("./InAppProvider");
Object.defineProperty(exports, "InAppProvider", { enumerable: true, get: function () { return InAppProvider_1.InAppProvider; } });
//# sourceMappingURL=index.js.map