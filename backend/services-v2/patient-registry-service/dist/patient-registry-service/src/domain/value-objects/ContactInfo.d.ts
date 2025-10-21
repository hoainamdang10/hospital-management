/**
 * ContactInfo Value Object
 * Patient contact information with Vietnamese standards
 */
import { ValueObject } from '../../../../shared/domain/base/value-object';
export interface ContactInfoProps {
    primaryPhone: string;
    secondaryPhone?: string | undefined;
    email?: string | undefined;
    address: Address;
    preferredContactMethod: 'phone' | 'email' | 'sms';
}
export interface Address {
    street: string;
    ward: string;
    district: string;
    city: string;
    province: string;
    postalCode?: string | undefined;
    country: string;
}
export declare class ContactInfo extends ValueObject<ContactInfoProps> {
    private constructor();
    protected validateFormat(): void;
    static create(props: ContactInfoProps): ContactInfo;
    get primaryPhone(): string;
    get secondaryPhone(): string | undefined;
    get email(): string | undefined;
    get address(): Address;
    get preferredContactMethod(): 'phone' | 'email' | 'sms';
    getFormattedPrimaryPhone(): string;
    getFormattedSecondaryPhone(): string | undefined;
    getFullAddress(): string;
    getShortAddress(): string;
    hasEmail(): boolean;
    hasSecondaryPhone(): boolean;
    canContactByEmail(): boolean;
    canContactByPhone(): boolean;
    canContactBySMS(): boolean;
    getContactPhones(): string[];
    isInHoChiMinhCity(): boolean;
    isInHanoi(): boolean;
    isInMajorCity(): boolean;
    private static isValidVietnamesePhoneNumber;
    private static isValidEmail;
    updatePrimaryPhone(primaryPhone: string): ContactInfo;
    updateSecondaryPhone(secondaryPhone?: string): ContactInfo;
    updateEmail(email?: string): ContactInfo;
    updateAddress(address: Address): ContactInfo;
    updatePreferredContactMethod(method: 'phone' | 'email' | 'sms'): ContactInfo;
    equals(other: ContactInfo): boolean;
}
//# sourceMappingURL=ContactInfo.d.ts.map