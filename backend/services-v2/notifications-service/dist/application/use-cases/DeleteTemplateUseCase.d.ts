/**
 * DeleteTemplateUseCase - Application Layer
 * Use case for deleting notification templates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ITemplateService } from '../../domain/services/ITemplateService';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';
export interface DeleteTemplateRequest {
    templateId: string;
    requestedBy: string;
    requestedByRole: string;
}
export interface DeleteTemplateResponse {
    success: boolean;
    data?: {
        templateId: string;
        deletedAt: string;
    };
    message?: string;
    code?: string;
}
export declare class DeleteTemplateUseCase extends BaseHealthcareUseCase<DeleteTemplateRequest, DeleteTemplateResponse> {
    private readonly templateService;
    constructor(templateService: ITemplateService);
    protected validateRequest(request: DeleteTemplateRequest): Promise<void>;
    protected executeImpl(request: DeleteTemplateRequest): Promise<DeleteTemplateResponse>;
}
//# sourceMappingURL=DeleteTemplateUseCase.d.ts.map