export declare class CronExpression {
    private readonly expression;
    private constructor();
    static create(expression: string): CronExpression;
    getNextOccurrence(from?: Date): Date;
    getNextOccurrences(count: number, from?: Date): Date[];
    getOccurrencesBetween(startDate: Date, endDate: Date): Date[];
    getValue(): string;
    equals(other: CronExpression): boolean;
    toString(): string;
}
//# sourceMappingURL=CronExpression.d.ts.map