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
exports.createSchedule = createSchedule;
exports.cancelSchedule = cancelSchedule;
exports.listSchedules = listSchedules;
exports.getSchedule = getSchedule;
exports.getAvailableSchedules = getAvailableSchedules;
const scheduleService = __importStar(require("../services/schedule.service"));
async function createSchedule(req, res, next) {
    try {
        if (!req.user)
            return;
        const { doctorId, departmentId, date, timeSlot, maxSlots, fee } = req.body;
        const schedule = await scheduleService.createSchedule(doctorId, departmentId, date, timeSlot, maxSlots, fee, req.user.userId, req.user.role);
        res.status(201).json(schedule);
    }
    catch (error) {
        next(error);
    }
}
async function cancelSchedule(req, res, next) {
    try {
        if (!req.user)
            return;
        const { id } = req.params;
        const { reason } = req.body;
        const result = await scheduleService.cancelSchedule(id, reason, req.user.userId, req.user.role);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function listSchedules(req, res, next) {
    try {
        const { departmentId, doctorId, startDate, endDate, includeCancelled } = req.query;
        const schedules = await scheduleService.listSchedules({
            departmentId: departmentId,
            doctorId: doctorId,
            startDate: startDate,
            endDate: endDate,
            includeCancelled: includeCancelled === 'true',
        });
        res.json(schedules);
    }
    catch (error) {
        next(error);
    }
}
async function getSchedule(req, res, next) {
    try {
        const { id } = req.params;
        const schedule = await scheduleService.getScheduleById(id);
        res.json(schedule);
    }
    catch (error) {
        next(error);
    }
}
async function getAvailableSchedules(req, res, next) {
    try {
        const { departmentId, doctorId, date } = req.query;
        const schedules = await scheduleService.getAvailableSchedules(departmentId, doctorId, date);
        res.json(schedules);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=schedule.controller.js.map