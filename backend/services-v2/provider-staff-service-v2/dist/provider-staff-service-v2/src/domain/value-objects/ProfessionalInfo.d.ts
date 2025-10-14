/**
 * ProfessionalInfo Value Object
 * Encapsulates professional information for healthcare staff
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ValueObject } from '../../../../shared/domain/base/value-object';
export interface ProfessionalInfoProps {
    licenseNumber?: string;
    specialization?: string;
    yearsOfExperience?: number;
    qualifications?: string[];
    certifications?: string[];
}
export declare class ProfessionalInfo extends ValueObject<ProfessionalInfoProps> {
    private constructor();
    /**
     * Validate format - required by ValueObject base class
     */
    protected validateFormat(): void;
    static create(props: ProfessionalInfoProps): ProfessionalInfo;
    get licenseNumber(): string | undefined;
    get specialization(): string | undefined;
    get yearsOfExperience(): number | undefined;
    get qualifications(): string[];
    get certifications(): string[];
}
//# sourceMappingURL=ProfessionalInfo.d.ts.map