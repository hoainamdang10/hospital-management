/**
 * Entity Base Class
 * Clean Architecture + DDD Implementation
 */
export declare abstract class Entity<T> {
    protected readonly props: T;
    protected constructor(props: T);
    abstract equals(other: Entity<T>): boolean;
}
//# sourceMappingURL=Entity.d.ts.map