import { parseExpression } from 'cron-parser';

export class CronExpression {
  private constructor(private readonly expression: string) {}

  public static create(expression: string): CronExpression {
    if (!expression || expression.trim().length === 0) {
      throw new Error('CRON expression cannot be empty');
    }

    try {
      parseExpression(expression);
    } catch (error) {
      throw new Error(`Invalid CRON expression: ${expression}. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return new CronExpression(expression.trim());
  }

  public getNextOccurrence(from: Date = new Date()): Date {
    const interval = parseExpression(this.expression, {
      currentDate: from,
      tz: 'UTC'
    });
    return interval.next().toDate();
  }

  public getNextOccurrences(count: number, from: Date = new Date()): Date[] {
    const interval = parseExpression(this.expression, {
      currentDate: from,
      tz: 'UTC'
    });
    const occurrences: Date[] = [];

    for (let i = 0; i < count; i++) {
      occurrences.push(interval.next().toDate());
    }

    return occurrences;
  }

  public getOccurrencesBetween(startDate: Date, endDate: Date): Date[] {
    const interval = parseExpression(this.expression, {
      currentDate: startDate,
      endDate: endDate,
      tz: 'UTC'
    });

    const occurrences: Date[] = [];

    try {
      while (true) {
        const next = interval.next();
        occurrences.push(next.toDate());
      }
    } catch (error) {
      // End of iteration
    }

    return occurrences;
  }

  public getValue(): string {
    return this.expression;
  }

  public equals(other: CronExpression): boolean {
    return this.expression === other.expression;
  }

  public toString(): string {
    return this.expression;
  }
}

