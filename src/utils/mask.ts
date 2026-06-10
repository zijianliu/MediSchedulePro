import { UserRole } from '../types/enums';

export function maskIdCard(idCard: string | null | undefined): string {
  if (!idCard) return '';
  if (idCard.length < 8) return idCard;
  return idCard.substring(0, 4) + '********' + idCard.substring(idCard.length - 4);
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  if (phone.length < 7) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

export function maskName(name: string | null | undefined): string {
  if (!name) return '';
  if (name.length <= 1) return name;
  return name[0] + '*'.repeat(name.length - 1);
}

export function canViewPatientInfo(operatorRole: string, operatorDeptId?: string, patientDeptId?: string): boolean {
  if (operatorRole === UserRole.ADMIN) return true;
  if (operatorRole === UserRole.FINANCE) return true;
  if (operatorRole === UserRole.DEPT_ADMIN && operatorDeptId === patientDeptId) return true;
  if (operatorRole === UserRole.DOCTOR && operatorDeptId === patientDeptId) return true;
  return false;
}

export function maskPatientData(
  patient: any,
  operatorRole: string,
  operatorDeptId?: string,
  selfId?: string,
): any {
  if (!patient) return patient;

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

export function maskPatientList(
  patients: any[],
  operatorRole: string,
  operatorDeptId?: string,
  selfId?: string,
): any[] {
  return patients.map(p => maskPatientData(p, operatorRole, operatorDeptId, selfId));
}
