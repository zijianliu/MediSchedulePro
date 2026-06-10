"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canTransition = canTransition;
exports.validateTransition = validateTransition;
exports.canCancel = canCancel;
exports.canPay = canPay;
exports.canCheckIn = canCheckIn;
exports.canCall = canCall;
exports.canComplete = canComplete;
exports.canMarkMissed = canMarkMissed;
exports.canRefund = canRefund;
exports.isFinalStatus = isFinalStatus;
const enums_1 = require("../types/enums");
const validTransitions = {
    [enums_1.AppointmentStatus.PENDING_PAYMENT]: [
        enums_1.AppointmentStatus.CANCELLED,
        enums_1.AppointmentStatus.TIMEOUT,
        enums_1.AppointmentStatus.PENDING_VISIT,
    ],
    [enums_1.AppointmentStatus.CANCELLED]: [
        enums_1.AppointmentStatus.REFUND_PROCESSING,
        enums_1.AppointmentStatus.REFUNDED,
    ],
    [enums_1.AppointmentStatus.TIMEOUT]: [
        enums_1.AppointmentStatus.CANCELLED,
    ],
    [enums_1.AppointmentStatus.PENDING_VISIT]: [
        enums_1.AppointmentStatus.CANCELLED,
        enums_1.AppointmentStatus.CHECKED_IN,
        enums_1.AppointmentStatus.CLINIC_CANCELLED_REFUND,
    ],
    [enums_1.AppointmentStatus.CHECKED_IN]: [
        enums_1.AppointmentStatus.IN_VISIT,
        enums_1.AppointmentStatus.MISSED,
        enums_1.AppointmentStatus.CLINIC_CANCELLED_REFUND,
    ],
    [enums_1.AppointmentStatus.IN_VISIT]: [
        enums_1.AppointmentStatus.COMPLETED,
        enums_1.AppointmentStatus.MISSED,
    ],
    [enums_1.AppointmentStatus.COMPLETED]: [],
    [enums_1.AppointmentStatus.MISSED]: [
        enums_1.AppointmentStatus.CHECKED_IN,
    ],
    [enums_1.AppointmentStatus.CLINIC_CANCELLED_REFUND]: [
        enums_1.AppointmentStatus.REFUND_PROCESSING,
    ],
    [enums_1.AppointmentStatus.REFUND_PROCESSING]: [
        enums_1.AppointmentStatus.REFUNDED,
    ],
    [enums_1.AppointmentStatus.REFUNDED]: [],
};
function canTransition(fromStatus, toStatus) {
    const validTos = validTransitions[fromStatus];
    if (!validTos)
        return false;
    return validTos.indexOf(toStatus) !== -1;
}
function validateTransition(fromStatus, toStatus) {
    if (!canTransition(fromStatus, toStatus)) {
        throw new Error(`不允许从 ${fromStatus} 状态跳转到 ${toStatus} 状态`);
    }
}
function canCancel(status) {
    return canTransition(status, enums_1.AppointmentStatus.CANCELLED);
}
function canPay(status) {
    return canTransition(status, enums_1.AppointmentStatus.PENDING_VISIT);
}
function canCheckIn(status) {
    return canTransition(status, enums_1.AppointmentStatus.CHECKED_IN);
}
function canCall(status) {
    return canTransition(status, enums_1.AppointmentStatus.IN_VISIT);
}
function canComplete(status) {
    return canTransition(status, enums_1.AppointmentStatus.COMPLETED);
}
function canMarkMissed(status) {
    return canTransition(status, enums_1.AppointmentStatus.MISSED);
}
function canRefund(status) {
    return canTransition(status, enums_1.AppointmentStatus.REFUND_PROCESSING);
}
function isFinalStatus(status) {
    const validTos = validTransitions[status];
    return !validTos || validTos.length === 0;
}
//# sourceMappingURL=stateMachine.js.map