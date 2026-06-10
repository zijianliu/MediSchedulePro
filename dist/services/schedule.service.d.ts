export declare function createSchedule(doctorId: string, departmentId: string, date: string, timeSlot: string, maxSlots: number, fee: number, operatorId: string, operatorRole: string): Promise<{
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
    };
    department: {
        name: string;
    };
    doctor: {
        realName: string;
    };
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
}>;
export declare function cancelSchedule(scheduleId: string, reason: string, operatorId: string, operatorRole: string): Promise<{
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
    affectedAppointments: number;
}>;
export declare function listSchedules(params: {
    departmentId?: string;
    doctorId?: string;
    startDate?: string;
    endDate?: string;
    includeCancelled?: boolean;
}): Promise<({
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
})[]>;
export declare function getScheduleById(id: string): Promise<{
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
}>;
export declare function getAvailableSchedules(departmentId?: string, doctorId?: string, date?: string): Promise<({
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
})[]>;
//# sourceMappingURL=schedule.service.d.ts.map