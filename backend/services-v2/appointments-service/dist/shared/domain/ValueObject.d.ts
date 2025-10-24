/**
 * Value Object Base Class
 * Clean Architecture + DDD Implementation
 */
export declare abstract class ValueObject<T> {
    protected readonly props: T;
    protected constructor(props: T);
    abstract equals(other: ValueObject<T>): boolean;
}
//# sourceMappingURL=ValueObject.d.ts.map