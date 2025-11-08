"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const ApplicationError_1 = require("../../../application/errors/ApplicationError");
function errorMiddleware(err, _req, res, _next) {
    if (err instanceof ApplicationError_1.ApplicationError) {
        res.status(err.status).json({ success: false, message: err.message });
        return;
    }
    if (err instanceof Error) {
        res.status(500).json({ success: false, message: err.message });
        return;
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
}
