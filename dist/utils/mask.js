"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskIdCard = maskIdCard;
exports.maskPhone = maskPhone;
exports.maskName = maskName;
exports.canViewPatientInfo = canViewPatientInfo;
exports.maskPatientData = maskPatientData;
exports.maskPatientList = maskPatientList;
const enums_1 = require("../types/enums");
function maskIdCard(idCard) {
    if (!idCard)
        return '';
    if (idCard.length < 8)
        return idCard;
    return idCard.substring(0, 4) + '********' + idCard.substring(idCard.length - 4);
}
function maskPhone(phone) {
    if (!phone)
        return '';
    if (phone.length < 7)
        return phone;
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}
function maskName(name) {
    if (!name)
        return '';
    if (name.length <= 1)
        return name;
    return name[0] + '*'.repeat(name.length - 1);
}
function canViewPatientInfo(operatorRole, operatorDeptId, patientDeptId) {
    if (operatorRole === enums_1.UserRole.ADMIN)
        return true;
    if (operatorRole === enums_1.UserRole.FINANCE)
        return true;
    if (operatorRole === enums_1.UserRole.DEPT_ADMIN && operatorDeptId === patientDeptId)
        return true;
    if (operatorRole === enums_1.UserRole.DOCTOR && operatorDeptId === patientDeptId)
        return true;
    return false;
}
function maskPatientData(patient, operatorRole, operatorDeptId, selfId) {
    if (!patient)
        return patient;
    const patientId = patient.id || patient.userId;
    const isSelf = selfId && patientId === selfId;
    const canView = canViewPatientInfo(operatorRole, operatorDeptId, patient.departmentId);
    if (isSelf || canView) {
        return patient;
    }
    const masked = { ...patient };
    if (masked.realName) {
        masked.realName = maskName(masked.realName);
    }
    if (masked.patientName) {
        masked.patientName = maskName(masked.patientName);
    }
    if (masked.idCard) {
        masked.idCard = maskIdCard(masked.idCard);
    }
    if (masked.patientIdCard) {
        masked.patientIdCard = maskIdCard(masked.patientIdCard);
    }
    if (masked.phone) {
        masked.phone = maskPhone(masked.phone);
    }
    if (masked.patientPhone) {
        masked.patientPhone = maskPhone(masked.patientPhone);
    }
    return masked;
}
function maskPatientList(patients, operatorRole, operatorDeptId, selfId) {
    return patients.map(p => maskPatientData(p, operatorRole, operatorDeptId, selfId));
}
//# sourceMappingURL=mask.js.map