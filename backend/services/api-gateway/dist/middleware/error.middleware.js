"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (error, req, res, next) => {
    console.error("API Gateway Error", {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        headers: req.headers,
        query: req.query,
    });
    // Extract language preference
    const language = req.headers["accept-language"]?.includes("en") ? "en" : "vi";
    const errorResponse = {
        success: false,
        error: language === "vi" ? "Lỗi API Gateway" : "API Gateway Error",
        message: process.env.NODE_ENV === "production"
            ? language === "vi"
                ? "Đã xảy ra lỗi, vui lòng thử lại"
                : "Something went wrong"
            : error.message,
        timestamp: new Date().toISOString(),
        service: "api-gateway",
    };
    res.status(500).json(errorResponse);
};
exports.errorHandler = errorHandler;
