/**
 * UserId Value Object
 * User ID Format: USR-YYYYMM-XXX
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ValueObject } from '@shared/domain/base/value-object';
interface UserIdProps {
    value: string;
}
export declare class UserId extends ValueObject<UserIdProps> {
    private constructor();
    /**
     * Validate format - required by ValueObject base class
     */
    protected validateFormat(): void;
    static create(value: string): UserId;
    static generate(): UserId;
    static fromUUID(uuid: string): UserId;
    /**
     * Create UserId from existing string value
     * Used by repository when reconstituting from database
     */
    static fromString(value: string): UserId;
    get value(): string;
    toString(): string;
}
export {};
//# sourceMappingURL=UserId.d.ts.map