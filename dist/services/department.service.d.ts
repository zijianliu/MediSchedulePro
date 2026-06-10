export declare function listDepartments(includeInactive?: boolean): Promise<({
    _count: {
        doctors: number;
        schedules: number;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    code: string | null;
    description: string | null;
    status: string;
})[]>;
export declare function getDepartmentById(id: string): Promise<{
    _count: {
        doctors: number;
        schedules: number;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    code: string | null;
    description: string | null;
    status: string;
}>;
export declare function listDoctors(departmentId?: string): Promise<{
    id: string;
    username: string;
    realName: string;
    role: string;
    departmentId: string | null;
    department: {
        name: string;
    } | null;
}[]>;
export declare function getDoctorById(id: string): Promise<{
    id: string;
    username: string;
    realName: string;
    role: string;
    departmentId: string | null;
    department: {
        name: string;
    } | null;
}>;
export declare function createDepartment(name: string, code?: string, description?: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    code: string | null;
    description: string | null;
    status: string;
}>;
export declare function updateDepartment(id: string, data: {
    name?: string;
    code?: string;
    description?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    code: string | null;
    description: string | null;
    status: string;
}>;
export declare function toggleDepartmentStatus(id: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    code: string | null;
    description: string | null;
    status: string;
}>;
//# sourceMappingURL=department.service.d.ts.map