/**
 * UpdateTemplateUseCase - Application Layer
 * Use case for updating notification templates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ITemplateService } from '../../domain/services/ITemplateService';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';
export interface UpdateTemplateRequest {
    templateId: string;
    name?: string;
    subject?: string;
    body?: string;
    language?: 'vi' | 'en';
    variables?: string[];
    tags?: string[];
    isActive?: boolean;
    isApproved?: boolean;
    requestedBy: string;
    requestedByRole: string;
}
export interface UpdateTemplateResponse {
    success: boolean;
    data?: {
        templateId: string;
        name: string;
        updatedFields: string[];
    };
    message?: string;
    code?: string;
}
export declare class UpdateTemplateUseCase extends BaseHealthcareUseCase<UpdateTemplateRequest, UpdateTemplateResponse> {
    private readonly templateService;
    constructor(templateService: ITemplateService);
    protected validateRequest(request: UpdateTemplateRequest): Promise<void>;
    protected executeImpl(request: UpdateTemplateRequest): Promise<UpdateTemplateResponse>;
}
//# sourceMappingURL=UpdateTemplateUseCase.d.ts.map