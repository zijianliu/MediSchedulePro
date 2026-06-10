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
exports.createAppointment = createAppointment;
exports.payAppointment = payAppointment;
exports.cancelAppointment = cancelAppointment;
exports.getAppointment = getAppointment;
exports.listPatientAppointments = listPatientAppointments;
exports.listDoctorAppointments = listDoctorAppointments;
exports.processTimeouts = processTimeouts;
exports.checkIn = checkIn;
exports.markMissed = markMissed;
exports.requeueMissed = requeueMissed;
exports.completeVisit = completeVisit;
const appointmentService = __importStar(require("../services/appointment.service"));
const visitService = __importStar(require("../services/visit.service"));
async function createAppointment(req, res, next) {
    try {
        if (!req.user)
            return;
        const { scheduleId, patientName, patientIdCard, patientPhone } = req.body;
        const appointment = await appointmentService.createAppointment(req.user.userId, scheduleId, patientName, patientIdCard, patientPhone);
        res.status(201).json(appointment);
    }
    catch (error) {
        next(error);
    }
}
async function payAppointment(req, res, next) {
    try {
        if (!req.user)
            return;
        const { id } = req.params;
        const appointment = await appointmentService.payAppointment(id, req.user.userId);
        res.json(appointment);
    }
    catch (error) {
        next(error);
    }
}
async function cancelAppointment(req, res, next) {
    try {
        if (!req.user)
            return;
        const { id } = req.params;
        const appointment = await appointmentService.cancelAppointment(id, req.user.userId, req.user.role);
        res.json(appointment);
    }
    catch (error) {
        next(error);
    }
}
async function getAppointment(req, res, next) {
    try {
        if (!req.user)
            return;
        const { id } = req.params;
        const appointment = await appointmentService.getAppointmentById(id, req.user.userId, req.user.role, req.user.departmentId);
        res.json(appointment);
    }
    catch (error) {
        next(error);
    }
}
async function listPatientAppointments(req, res, next) {
    try {
        if (!req.user)
            return;
        const { status } = req.query;
        const appointments = await appointmentService.listPatientAppointments(req.user.userId, status);
        res.json(appointments);
    }
    catch (error) {
        next(error);
    }
}
async function listDoctorAppointments(req, res, next) {
    try {
        if (!req.user)
            return;
        const { date, status } = req.query;
        const appointments = await appointmentService.listDoctorAppointments(req.user.userId, date, status);
        res.json(appointments);
    }
    catch (error) {
        next(error);
    }
}
async function processTimeouts(req, res, next) {
    try {
        const result = await appointmentService.processTimeoutAppointments();
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function checkIn(req, res, next) {
    try {
        if (!req.user)
            return;
        const { id } = req.params;
        const result = await visitService.checkIn(id, req.user.userId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function markMissed(req, res, next) {
    try {
        if (!req.user)
            return;
        const { id } = req.params;
        const result = await visitService.markMissed(id, req.user.userId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function requeueMissed(req, res, next) {
    try {
        if (!req.user)
            return;
        const { id } = req.params;
        const result = await visitService.requeueMissed(id, req.user.userId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function completeVisit(req, res, next) {
    try {
        if (!req.user)
            return;
        const { id } = req.params;
        const result = await visitService.completeVisit(id, req.user.userId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=appointment.controller.js.map