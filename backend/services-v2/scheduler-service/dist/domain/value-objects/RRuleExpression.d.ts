export declare class RRuleExpression {
    private readonly expression;
    private readonly rrule;
    private constructor();
    static create(expression: string): RRuleExpression;
    getNextOccurrence(from?: Date): Date | null;
    getNextOccurrences(count: number, from?: Date): Date[];
    getOccurrencesBetween(startDate: Date, endDate: Date): Date[];
    getValue(): string;
    equals(other: RRuleExpression): boolean;
    toString(): string;
}
//# sourceMappingURL=RRuleExpression.d.ts.map