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
const appointmentController = __importStar(require("../controllers/appointment.controller"));
const auth_1 = require("../middleware/auth");
const enums_1 = require("../types/enums");
const router = (0, express_1.Router)();
router.post('/', auth_1.authMiddleware, appointmentController.createAppointment);
router.get('/mine', auth_1.authMiddleware, appointmentController.listPatientAppointments);
router.get('/my', auth_1.authMiddleware, appointmentController.listPatientAppointments);
router.get('/:id', auth_1.authMiddleware, appointmentController.getAppointment);
router.post('/:id/pay', auth_1.authMiddleware, appointmentController.payAppointment);
router.post('/:id/cancel', auth_1.authMiddleware, appointmentController.cancelAppointment);
router.post('/:id/checkin', auth_1.authMiddleware, appointmentController.checkIn);
router.post('/:id/miss', auth_1.authMiddleware, appointmentController.markMissed);
router.post('/:id/requeue', auth_1.authMiddleware, appointmentController.requeueMissed);
router.post('/:id/complete', auth_1.authMiddleware, appointmentController.completeVisit);
router.get('/doctor/mine', auth_1.authMiddleware, (0, auth_1.requireRoles)(enums_1.UserRole.DOCTOR), appointmentController.listDoctorAppointments);
router.post('/process-timeouts', appointmentController.processTimeouts);
exports.default = router;
//# sourceMappingURL=appointment.routes.js.map