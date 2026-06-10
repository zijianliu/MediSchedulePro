export declare function waitForAllNotifications(): Promise<void>;
export declare function notifyAppointmentSuccess(appointmentId: string): Promise<void>;
export declare function notifyAppointmentCancelled(appointmentId: string): Promise<void>;
export declare function notifyClinicCancelled(scheduleId: string): Promise<void>;
export declare function notifyRefundSuccess(appointmentId: string): Promise<void>;
export declare function listUserNotifications(userId: string, page?: number, pageSize?: number): Promise<{
    list: {
        id: string;
        createdAt: Date;
        userId: string;
        status: string;
        appointmentId: string | null;
        type: string;
        content: string;
        title: string;
        failReason: string | null;
        sentAt: Date | null;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
//# sourceMappingURL=notification.service.d.ts.map