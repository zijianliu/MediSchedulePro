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
exports.checkIn = checkIn;
exports.callNextPatient = callNextPatient;
exports.completeVisit = completeVisit;
exports.markMissed = markMissed;
exports.requeueMissed = requeueMissed;
exports.getDoctorQueue = getDoctorQueue;
const visitService = __importStar(require("../services/visit.service"));
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
async function callNextPatient(req, res, next) {
    try {
        if (!req.user)
            return;
        const { scheduleId } = req.body;
        const result = await visitService.callNextPatient(scheduleId, req.user.userId);
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
async function getDoctorQueue(req, res, next) {
    try {
        if (!req.user)
            return;
        const { doctorId } = req.params;
        const { date } = req.query;
        if (req.user.role === 'DOCTOR' && req.user.userId !== doctorId) {
            return res.status(403).json({ code: 'FORBIDDEN', message: '无权限查看其他医生队列' });
        }
        const queue = await visitService.getDoctorQueue(doctorId, date || new Date().toISOString().split('T')[0]);
        res.json(queue);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=visit.controller.js.map