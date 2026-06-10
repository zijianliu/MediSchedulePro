export declare function listDepartments(): Promise<({
    _count: {
        doctors: number;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string | null;
})[]>;
export declare function getDepartmentById(id: string): Promise<{
    _count: {
        doctors: number;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string | null;
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
export declare function createDepartment(name: string, description?: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string | null;
}>;
//# sourceMappingURL=department.service.d.ts.map