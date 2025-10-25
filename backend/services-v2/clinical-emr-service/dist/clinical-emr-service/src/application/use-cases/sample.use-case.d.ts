/**
 * Sample Use Case - Application Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
export interface SampleRequest {
}
export interface SampleResponse {
    success: boolean;
    message: string;
}
export declare class SampleUseCase extends BaseHealthcareUseCase<SampleRequest, SampleResponse> {
    constructor();
    protected executeInternal(request: SampleRequest): Promise<SampleResponse>;
    authorize(request: SampleRequest, userId: string): Promise<boolean>;
    involvesPHI(request: SampleRequest): boolean;
    getPatientId(request: SampleRequest): string | null;
}
//# sourceMappingURL=sample.use-case.d.ts.map