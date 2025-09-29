import { Request, Response } from 'express';
export declare class DepartmentController {
    private departmentRepository;
    constructor();
    getAllDepartments(req: Request, res: Response): Promise<void>;
    getDepartmentStats(req: Request, res: Response): Promise<void>;
    getDepartmentById(req: Request, res: Response): Promise<void>;
    getSubDepartments(req: Request, res: Response): Promise<void>;
    getDepartmentDoctors(req: Request, res: Response): Promise<void>;
    getDepartmentRooms(req: Request, res: Response): Promise<void>;
    getDepartmentTree(req: Request, res: Response): Promise<void>;
    getChildDepartments(req: Request, res: Response): Promise<void>;
    getDepartmentPath(req: Request, res: Response): Promise<void>;
    createDepartment(req: Request, res: Response): Promise<void>;
    updateDepartment(req: Request, res: Response): Promise<void>;
    deleteDepartment(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=department.controller.d.ts.map