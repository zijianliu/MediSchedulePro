export declare function register(username: string, password: string, realName: string, role?: string, departmentId?: string, idCard?: string, phone?: string): Promise<{
    token: string;
    user: {
        id: string;
        username: string;
        realName: string;
        role: string;
        departmentId: string | null;
        createdAt: Date;
    };
}>;
export declare function login(username: string, password: string): Promise<{
    token: string;
    user: {
        id: string;
        username: string;
        realName: string;
        role: string;
        departmentId: string | null;
    };
}>;
export declare function getCurrentUser(userId: string): Promise<{
    id: string;
    username: string;
    realName: string;
    role: string;
    idCard: string | null;
    phone: string | null;
    departmentId: string | null;
    createdAt: Date;
}>;
//# sourceMappingURL=auth.service.d.ts.map