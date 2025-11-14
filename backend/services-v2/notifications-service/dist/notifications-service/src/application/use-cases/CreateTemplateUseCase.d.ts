/**
 * CreateTemplateUseCase - Application Layer
 * Use case for creating notification templates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ITemplateService } from '../../domain/services/ITemplateService';
export interface CreateTemplateRequest {
    name: string;
    type: string;
    subject?: string;
    body: string;
    language: 'vi' | 'en';
    variables?: string[];
    tags?: string[];
    isActive?: boolean;
    requestedBy: string;
    requestedByRole: string;
}
export interface CreateTemplateResponse {
    success: boolean;
    data?: {
        templateId: string;
        name: string;
        type: string;
    };
    message?: string;
    code?: string;
}
export declare class CreateTemplateUseCase {
    private readonly templateService;
    constructor(templateService: ITemplateService);
    /**
     * Execute the use case
     */
    execute(request: CreateTemplateRequest): Promise<CreateTemplateResponse>;
    protected validateRequest(request: CreateTemplateRequest): Promise<void>;
    protected executeImpl(request: CreateTemplateRequest): Promise<CreateTemplateResponse>;
    /**
     * Extract variables from template body
     * Supports {{variable}} and {variable} formats
     */
    private extractVariables;
}
//# sourceMappingURL=CreateTemplateUseCase.d.ts.map