export declare class Timezone {
    private readonly value;
    private static readonly VALID_TIMEZONES;
    private constructor();
    static create(value: string): Timezone;
    static utc(): Timezone;
    static hoChiMinh(): Timezone;
    getValue(): string;
    isUTC(): boolean;
    equals(other: Timezone): boolean;
    toString(): string;
}
//# sourceMappingURL=Timezone.d.ts.map