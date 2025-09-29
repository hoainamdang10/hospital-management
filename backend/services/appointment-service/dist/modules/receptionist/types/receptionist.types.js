"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueError = exports.CheckInError = exports.ReceptionistError = void 0;
class ReceptionistError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'ReceptionistError';
    }
}
exports.ReceptionistError = ReceptionistError;
class CheckInError extends ReceptionistError {
    constructor(message, code = 'CHECK_IN_ERROR') {
        super(message, code, 400);
        this.name = 'CheckInError';
    }
}
exports.CheckInError = CheckInError;
class QueueError extends ReceptionistError {
    constructor(message, code = 'QUEUE_ERROR') {
        super(message, code, 400);
        this.name = 'QueueError';
    }
}
exports.QueueError = QueueError;
//# sourceMappingURL=receptionist.types.js.map