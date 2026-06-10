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
exports.listDepartments = listDepartments;
exports.getDepartment = getDepartment;
exports.listDoctors = listDoctors;
exports.getDoctor = getDoctor;
exports.createDepartment = createDepartment;
exports.updateDepartment = updateDepartment;
exports.toggleDepartmentStatus = toggleDepartmentStatus;
const departmentService = __importStar(require("../services/department.service"));
async function listDepartments(req, res, next) {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const departments = await departmentService.listDepartments(includeInactive);
        res.json(departments);
    }
    catch (error) {
        next(error);
    }
}
async function getDepartment(req, res, next) {
    try {
        const { id } = req.params;
        const department = await departmentService.getDepartmentById(id);
        res.json(department);
    }
    catch (error) {
        next(error);
    }
}
async function listDoctors(req, res, next) {
    try {
        const { departmentId } = req.query;
        const doctors = await departmentService.listDoctors(departmentId);
        res.json(doctors);
    }
    catch (error) {
        next(error);
    }
}
async function getDoctor(req, res, next) {
    try {
        const { id } = req.params;
        const doctor = await departmentService.getDoctorById(id);
        res.json(doctor);
    }
    catch (error) {
        next(error);
    }
}
async function createDepartment(req, res, next) {
    try {
        const { name, code, description } = req.body;
        const department = await departmentService.createDepartment(name, code, description);
        res.status(201).json(department);
    }
    catch (error) {
        next(error);
    }
}
async function updateDepartment(req, res, next) {
    try {
        const { id } = req.params;
        const { name, code, description } = req.body;
        const department = await departmentService.updateDepartment(id, { name, code, description });
        res.json(department);
    }
    catch (error) {
        next(error);
    }
}
async function toggleDepartmentStatus(req, res, next) {
    try {
        const { id } = req.params;
        const department = await departmentService.toggleDepartmentStatus(id);
        res.json(department);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=department.controller.js.map