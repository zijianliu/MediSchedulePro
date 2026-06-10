export declare const UserRole: {
    readonly PATIENT: "PATIENT";
    readonly DOCTOR: "DOCTOR";
    readonly DEPT_ADMIN: "DEPT_ADMIN";
    readonly FINANCE: "FINANCE";
    readonly ADMIN: "ADMIN";
};
export type UserRole = typeof UserRole[keyof typeof UserRole];
export declare const TimeSlot: {
    readonly MORNING: "MORNING";
    readonly AFTERNOON: "AFTERNOON";
    readonly EVENING: "EVENING";
};
export type TimeSlot = typeof TimeSlot[keyof typeof TimeSlot];
export declare const AppointmentStatus: {
    readonly PENDING_PAYMENT: "PENDING_PAYMENT";
    readonly CANCELLED: "CANCELLED";
    readonly TIMEOUT: "TIMEOUT";
    readonly PENDING_VISIT: "PENDING_VISIT";
    readonly CHECKED_IN: "CHECKED_IN";
    readonly IN_VISIT: "IN_VISIT";
    readonly COMPLETED: "COMPLETED";
    readonly MISSED: "MISSED";
    readonly CLINIC_CANCELLED_REFUND: "CLINIC_CANCELLED_REFUND";
    readonly REFUND_PROCESSING: "REFUND_PROCESSING";
    readonly REFUNDED: "REFUNDED";
};
export type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];
export declare const RefundStatus: {
    readonly PENDING: "PENDING";
    readonly PROCESSING: "PROCESSING";
    readonly COMPLETED: "COMPLETED";
    readonly FAILED: "FAILED";
};
export type RefundStatus = typeof RefundStatus[keyof typeof RefundStatus];
export declare const NotificationType: {
    readonly APPOINTMENT_SUCCESS: "APPOINTMENT_SUCCESS";
    readonly APPOINTMENT_CANCELLED: "APPOINTMENT_CANCELLED";
    readonly CLINIC_CANCELLED: "CLINIC_CANCELLED";
    readonly REFUND_SUCCESS: "REFUND_SUCCESS";
};
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];
export declare const NotificationStatus: {
    readonly PENDING: "PENDING";
    readonly SENT: "SENT";
    readonly FAILED: "FAILED";
};
export type NotificationStatus = typeof NotificationStatus[keyof typeof NotificationStatus];
export declare const LogType: {
    readonly SCHEDULE_CREATE: "SCHEDULE_CREATE";
    readonly SCHEDULE_UPDATE: "SCHEDULE_UPDATE";
    readonly SCHEDULE_CANCEL: "SCHEDULE_CANCEL";
    readonly APPOINTMENT_CREATE: "APPOINTMENT_CREATE";
    readonly APPOINTMENT_PAY: "APPOINTMENT_PAY";
    readonly APPOINTMENT_CANCEL: "APPOINTMENT_CANCEL";
    readonly APPOINTMENT_CHECKIN: "APPOINTMENT_CHECKIN";
    readonly APPOINTMENT_MISSED: "APPOINTMENT_MISSED";
    readonly APPOINTMENT_COMPLETED: "APPOINTMENT_COMPLETED";
    readonly REFUND_PROCESS: "REFUND_PROCESS";
    readonly REFUND_COMPLETE: "REFUND_COMPLETE";
};
export type LogType = typeof LogType[keyof typeof LogType];
//# sourceMappingURL=enums.d.ts.map