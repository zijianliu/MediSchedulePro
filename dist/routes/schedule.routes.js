"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scheduleController = __importStar(require("../controllers/schedule.controller"));
const auth_1 = require("../middleware/auth");
const enums_1 = require("../types/enums");
const router = (0, express_1.Router)();
router.get('/', scheduleController.listSchedules);
router.get('/available', scheduleController.getAvailableSchedules);
router.get('/:id', scheduleController.getSchedule);
router.post('/', auth_1.authMiddleware, (0, auth_1.requireRoles)(enums_1.UserRole.ADMIN, enums_1.UserRole.DEPT_ADMIN), scheduleController.createSchedule);
router.post('/:id/cancel', auth_1.authMiddleware, (0, auth_1.requireRoles)(enums_1.UserRole.ADMIN, enums_1.UserRole.DEPT_ADMIN), scheduleController.cancelSchedule);
exports.default = router;
//# sourceMappingURL=schedule.routes.js.map