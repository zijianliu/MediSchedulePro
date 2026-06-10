export declare function checkIn(appointmentId: string, patientId: string): Promise<{
    appointmentId: string;
    queueNumber: number;
}>;
export declare function callNextPatient(scheduleId: string, doctorId: string): Promise<({
    patient: {
        id: string;
        realName: string;
    };
} & {
    id: string;
    departmentId: string;
    createdAt: Date;
    updatedAt: Date;
    patientId: string;
    scheduleId: string;
    status: string;
    fee: number;
    queueNumber: number | null;
    patientName: string | null;
    patientIdCard: string | null;
    patientPhone: string | null;
    checkedInAt: Date | null;
    completedAt: Date | null;
}) | null>;
export declare function completeVisit(appointmentId: string, doctorId: string): Promise<{
    success: boolean;
}>;
export declare function markMissed(appointmentId: string, doctorId: string): Promise<{
    success: boolean;
}>;
export declare function requeueMissed(appointmentId: string, doctorId: string): Promise<{
    success: boolean;
    queueNumber: number;
}>;
export declare function getDoctorQueue(doctorId: string, date: string): Promise<any[]>;
//# sourceMappingURL=visit.service.d.ts.map