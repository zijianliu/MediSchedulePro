export const UserRole = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  DEPT_ADMIN: 'DEPT_ADMIN',
  FINANCE: 'FINANCE',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const TimeSlot = {
  MORNING: 'MORNING',
  AFTERNOON: 'AFTERNOON',
  EVENING: 'EVENING',
} as const;

export type TimeSlot = typeof TimeSlot[keyof typeof TimeSlot];

export const AppointmentStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT',
  PENDING_VISIT: 'PENDING_VISIT',
  CHECKED_IN: 'CHECKED_IN',
  IN_VISIT: 'IN_VISIT',
  COMPLETED: 'COMPLETED',
  MISSED: 'MISSED',
  CLINIC_CANCELLED_REFUND: 'CLINIC_CANCELLED_REFUND',
  REFUND_PROCESSING: 'REFUND_PROCESSING',
  REFUNDED: 'REFUNDED',
} as const;

export type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];

export const RefundStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type RefundStatus = typeof RefundStatus[keyof typeof RefundStatus];

export const NotificationType = {
  APPOINTMENT_SUCCESS: 'APPOINTMENT_SUCCESS',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  CLINIC_CANCELLED: 'CLINIC_CANCELLED',
  REFUND_SUCCESS: 'REFUND_SUCCESS',
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;

export type NotificationStatus = typeof NotificationStatus[keyof typeof NotificationStatus];

export const LogType = {
  SCHEDULE_CREATE: 'SCHEDULE_CREATE',
  SCHEDULE_UPDATE: 'SCHEDULE_UPDATE',
  SCHEDULE_CANCEL: 'SCHEDULE_CANCEL',
  APPOINTMENT_CREATE: 'APPOINTMENT_CREATE',
  APPOINTMENT_PAY: 'APPOINTMENT_PAY',
  APPOINTMENT_CANCEL: 'APPOINTMENT_CANCEL',
  APPOINTMENT_CHECKIN: 'APPOINTMENT_CHECKIN',
  APPOINTMENT_MISSED: 'APPOINTMENT_MISSED',
  APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
  REFUND_PROCESS: 'REFUND_PROCESS',
  REFUND_COMPLETE: 'REFUND_COMPLETE',
} as const;

export type LogType = typeof LogType[keyof typeof LogType];
