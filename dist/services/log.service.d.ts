export declare function logOperation(tx: any, type: string, operatorId: string, operatorRole: string, targetType: string, targetId?: string, content?: string): Promise<void>;
export declare function logStatusChange(tx: any, appointmentId: string, fromStatus: string | null, toStatus: string, reason?: string, operatorId?: string): Promise<void>;
export declare function listOperationLogs(params: {
    page?: number;
    pageSize?: number;
    type?: string;
    operatorId?: string;
    targetType?: string;
}): Promise<{
    list: ({
        operator: {
            id: string;
            realName: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        operatorId: string;
        type: string;
        targetType: string;
        operatorRole: string;
        targetId: string | null;
        content: string | null;
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function listStatusLogs(appointmentId: string): Promise<{
    id: string;
    createdAt: Date;
    appointmentId: string;
    fromStatus: string | null;
    toStatus: string;
    operatorId: string | null;
    reason: string | null;
}[]>;
//# sourceMappingURL=log.service.d.ts.map