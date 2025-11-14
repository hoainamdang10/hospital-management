/**
 * GetTemplatesUseCase - Application Layer
 * Use case for retrieving notification templates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ITemplateService } from '../../domain/services/ITemplateService';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';
export interface GetTemplatesRequest {
    templateType?: string;
    language?: 'vi' | 'en';
    isActive?: boolean;
    isApproved?: boolean;
    tags?: string[];
    limit?: number;
    offset?: number;
    requestedBy: string;
    requestedByRole: string;
}
export interface GetTemplatesResponse {
    success: boolean;
    data?: {
        templates: Array<{
            id: string;
            name: string;
            type: string;
            subject?: string;
            body: string;
            language: string;
            variables: string[];
            isActive: boolean;
            isApproved: boolean;
            tags: string[];
            createdAt: string;
            updatedAt: string;
        }>;
        total: number;
        limit: number;
        offset: number;
    };
    message?: string;
    code?: string;
}
export declare class GetTemplatesUseCase extends BaseHealthcareUseCase<GetTemplatesRequest, GetTemplatesResponse> {
    private readonly templateService;
    constructor(templateService: ITemplateService);
    protected validateRequest(request: GetTemplatesRequest): Promise<void>;
    protected executeImpl(request: GetTemplatesRequest): Promise<GetTemplatesResponse>;
}
//# sourceMappingURL=GetTemplatesUseCase.d.ts.map