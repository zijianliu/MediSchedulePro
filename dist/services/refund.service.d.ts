export declare function listRefunds(operatorId: string, operatorRole: string, operatorDeptId?: string | null): Promise<({
    patient: {
        id: string;
        realName: string;
        phone: string | null;
    };
    appointment: {
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
    };
    operator: {
        id: string;
        realName: string;
    } | null;
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    patientId: string;
    status: string;
    appointmentId: string;
    operatorId: string | null;
    reason: string;
    amount: number;
})[]>;
export declare function getRefundById(id: string, operatorId: string, operatorRole: string): Promise<{
    patient: {
        id: string;
        realName: string;
        idCard: string | null;
        phone: string | null;
    };
    appointment: {
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
    };
    operator: {
        id: string;
        realName: string;
    } | null;
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    patientId: string;
    status: string;
    appointmentId: string;
    operatorId: string | null;
    reason: string;
    amount: number;
}>;
export declare function processRefund(refundId: string, operatorId: string, operatorRole: string): Promise<{
    appointment: {
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
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    patientId: string;
    status: string;
    appointmentId: string;
    operatorId: string | null;
    reason: string;
    amount: number;
}>;
export declare function completeRefund(refundId: string, operatorId: string, operatorRole: string): Promise<{
    appointment: {
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
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    patientId: string;
    status: string;
    appointmentId: string;
    operatorId: string | null;
    reason: string;
    amount: number;
}>;
//# sourceMappingURL=refund.service.d.ts.map