"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
function errorHandler(err, req, res, next) {
    console.error('Error:', err.message);
    if (err instanceof errors_1.AppError) {
        res.status(err.statusCode).json({
            code: err.code,
            message: err.message,
        });
        return;
    }
    res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message || '服务器内部错误',
    });
}
//# sourceMappingURL=errorHandler.js.map