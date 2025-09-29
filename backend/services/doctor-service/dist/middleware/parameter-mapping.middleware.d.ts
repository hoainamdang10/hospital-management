import { Request, Response, NextFunction } from 'express';
interface ParameterMapping {
    [kebabCase: string]: string;
}
export declare const parameterMappingMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const getMappedParameterName: (kebabCase: string) => string;
export declare const hasParameterMapping: (kebabCase: string) => boolean;
export declare const getAllParameterMappings: () => ParameterMapping;
export default parameterMappingMiddleware;
//# sourceMappingURL=parameter-mapping.middleware.d.ts.map