export declare function createAppointment(patientId: string, scheduleId: string, patientName: string, patientIdCard: string, patientPhone: string): Promise<{
    schedule: {
        department: {
            name: string;
        };
        doctor: {
            realName: string;
        };
    } & {
        id: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        fee: number;
        doctorId: string;
        date: Date;
        timeSlot: string;
        maxSlots: number;
        isCancelled: boolean;
        cancelReason: string | null;
    };
} & {
    id: string;
    departmentId: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
    patientId: string;
    scheduleId: string;
    fee: number;
    queueNumber: number | null;
    patientName: string | null;
    patientIdCard: string | null;
    patientPhone: string | null;
    checkedInAt: Date | null;
    completedAt: Date | null;
}>;
export declare function payAppointment(appointmentId: string, patientId: string): Promise<{
    id: string;
    departmentId: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
    patientId: string;
    scheduleId: string;
    fee: number;
    queueNumber: number | null;
    patientName: string | null;
    patientIdCard: string | null;
    patientPhone: string | null;
    checkedInAt: Date | null;
    completedAt: Date | null;
} | null>;
export declare function cancelAppointment(appointmentId: string, userId: string, userRole: string): Promise<{
    schedule: {
        department: {
            name: string;
        };
        doctor: {
            realName: string;
        };
    } & {
        id: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        fee: number;
        doctorId: string;
        date: Date;
        timeSlot: string;
        maxSlots: number;
        isCancelled: boolean;
        cancelReason: string | null;
    };
} & {
    id: string;
    departmentId: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
    patientId: string;
    scheduleId: string;
    fee: number;
    queueNumber: number | null;
    patientName: string | null;
    patientIdCard: string | null;
    patientPhone: string | null;
    checkedInAt: Date | null;
    completedAt: Date | null;
}>;
export declare function getAppointmentById(id: string, userId: string, userRole: string, userDeptId?: string | null): Promise<{
    patient: any;
    schedule: {
        department: {
            id: string;
            name: string;
        };
        doctor: {
            id: string;
            realName: string;
        };
        slotInventory: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            scheduleId: string;
            totalSlots: number;
            bookedSlots: number;
            lockedSlots: number;
            availableSlots: number;
            version: number;
        } | null;
    } & {
        id: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        fee: number;
        doctorId: string;
        date: Date;
        timeSlot: string;
        maxSlots: number;
        isCancelled: boolean;
        cancelReason: string | null;
    };
    refundRecords: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        patientId: string;
        appointmentId: string;
        operatorId: string | null;
        reason: string;
        amount: number;
    }[];
    statusLogs: {
        id: string;
        createdAt: Date;
        appointmentId: string;
        fromStatus: string | null;
        toStatus: string;
        operatorId: string | null;
        reason: string | null;
    }[];
    id: string;
    departmentId: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
    patientId: string;
    scheduleId: string;
    fee: number;
    queueNumber: number | null;
    patientName: string | null;
    patientIdCard: string | null;
    patientPhone: string | null;
    checkedInAt: Date | null;
    completedAt: Date | null;
}>;
export declare function listPatientAppointments(patientId: string, status?: string): Promise<({
    schedule: {
        department: {
            id: string;
            name: string;
        };
        doctor: {
            id: string;
            realName: string;
        };
    } & {
        id: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        fee: number;
        doctorId: string;
        date: Date;
        timeSlot: string;
        maxSlots: number;
        isCancelled: boolean;
        cancelReason: string | null;
    };
} & {
    id: string;
    departmentId: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
    patientId: string;
    scheduleId: string;
    fee: number;
    queueNumber: number | null;
    patientName: string | null;
    patientIdCard: string | null;
    patientPhone: string | null;
    checkedInAt: Date | null;
    completedAt: Date | null;
})[]>;
export declare function listDoctorAppointments(doctorId: string, date?: string, status?: string): Promise<any[]>;
export declare function processTimeoutAppointments(): Promise<{
    processed: number;
}>;
//# sourceMappingURL=appointment.service.d.ts.map