"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationError = void 0;
class ApplicationError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.ApplicationError = ApplicationError;
