"use strict";
/**
 * Logger Module
 * Production-ready structured logging using Pino
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinoLoggerAdapter = exports.createProductionLogger = exports.logger = void 0;
// Re-export from PinoLogger for backward compatibility
var PinoLogger_1 = require("./PinoLogger");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return PinoLogger_1.logger; } });
Object.defineProperty(exports, "createProductionLogger", { enumerable: true, get: function () { return PinoLogger_1.createProductionLogger; } });
Object.defineProperty(exports, "PinoLoggerAdapter", { enumerable: true, get: function () { return PinoLogger_1.PinoLoggerAdapter; } });
//# sourceMappingURL=Logger.js.map