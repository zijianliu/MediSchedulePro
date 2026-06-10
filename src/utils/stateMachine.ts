import { AppointmentStatus } from '../types/enums';

const validTransitions: Record<string, string[]> = {
  [AppointmentStatus.PENDING_PAYMENT]: [
    AppointmentStatus.CANCELLED,
    AppointmentStatus.TIMEOUT,
    AppointmentStatus.PENDING_VISIT,
  ],
  [AppointmentStatus.CANCELLED]: [
    AppointmentStatus.REFUND_PROCESSING,
    AppointmentStatus.REFUNDED,
  ],
  [AppointmentStatus.TIMEOUT]: [
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.PENDING_VISIT]: [
    AppointmentStatus.CANCELLED,
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.CLINIC_CANCELLED_REFUND,
  ],
  [AppointmentStatus.CHECKED_IN]: [
    AppointmentStatus.IN_VISIT,
    AppointmentStatus.MISSED,
    AppointmentStatus.CLINIC_CANCELLED_REFUND,
  ],
  [AppointmentStatus.IN_VISIT]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.MISSED,
  ],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.MISSED]: [
    AppointmentStatus.CHECKED_IN,
  ],
  [AppointmentStatus.CLINIC_CANCELLED_REFUND]: [
    AppointmentStatus.REFUND_PROCESSING,
  ],
  [AppointmentStatus.REFUND_PROCESSING]: [
    AppointmentStatus.REFUNDED,
  ],
  [AppointmentStatus.REFUNDED]: [],
};

export function canTransition(fromStatus: string, toStatus: string): boolean {
  const validTos = validTransitions[fromStatus];
  if (!validTos) return false;
  return validTos.indexOf(toStatus) !== -1;
}

export function validateTransition(fromStatus: string, toStatus: string): void {
  if (!canTransition(fromStatus, toStatus)) {
    throw new Error(`不允许从 ${fromStatus} 状态跳转到 ${toStatus} 状态`);
  }
}

export function canCancel(status: string): boolean {
  return canTransition(status, AppointmentStatus.CANCELLED);
}

export function canPay(status: string): boolean {
  return canTransition(status, AppointmentStatus.PENDING_VISIT);
}

export function canCheckIn(status: string): boolean {
  return canTransition(status, AppointmentStatus.CHECKED_IN);
}

export function canCall(status: string): boolean {
  return canTransition(status, AppointmentStatus.IN_VISIT);
}

export function canComplete(status: string): boolean {
  return canTransition(status, AppointmentStatus.COMPLETED);
}

export function canMarkMissed(status: string): boolean {
  return canTransition(status, AppointmentStatus.MISSED);
}

export function canRefund(status: string): boolean {
  return canTransition(status, AppointmentStatus.REFUND_PROCESSING);
}

export function isFinalStatus(status: string): boolean {
  const validTos = validTransitions[status];
  return !validTos || validTos.length === 0;
}
