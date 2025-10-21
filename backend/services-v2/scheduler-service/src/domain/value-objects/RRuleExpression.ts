import { RRule, rrulestr } from 'rrule';

export class RRuleExpression {
  private readonly rrule: RRule;

  private constructor(private readonly expression: string) {
    this.rrule = rrulestr(expression) as RRule;
  }

  public static create(expression: string): RRuleExpression {
    if (!expression || expression.trim().length === 0) {
      throw new Error('RRULE expression cannot be empty');
    }

    const trimmed = expression.trim();

    // Validate FREQ is present
    if (!trimmed.includes('FREQ=')) {
      throw new Error(`Invalid RRULE expression: ${expression}. FREQ is required`);
    }

    try {
      rrulestr(trimmed);
    } catch (error) {
      throw new Error(`Invalid RRULE expression: ${expression}. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return new RRuleExpression(trimmed);
  }

  public getNextOccurrence(from: Date = new Date()): Date | null {
    const next = this.rrule.after(from, true);
    return next;
  }

  public getNextOccurrences(count: number, from: Date = new Date()): Date[] {
    return this.rrule.all((date, i) => {
      return date >= from && i < count;
    });
  }

  public getOccurrencesBetween(startDate: Date, endDate: Date): Date[] {
    return this.rrule.between(startDate, endDate, true);
  }

  public getValue(): string {
    return this.expression;
  }

  public equals(other: RRuleExpression): boolean {
    return this.expression === other.expression;
  }

  public toString(): string {
    return this.expression;
  }
}

