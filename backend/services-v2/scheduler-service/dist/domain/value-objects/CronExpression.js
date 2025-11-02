"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronExpression = void 0;
const cron_parser_1 = require("cron-parser");
class CronExpression {
    constructor(expression) {
        this.expression = expression;
    }
    static create(expression) {
        if (!expression || expression.trim().length === 0) {
            throw new Error('CRON expression cannot be empty');
        }
        try {
            (0, cron_parser_1.parseExpression)(expression);
        }
        catch (error) {
            throw new Error(`Invalid CRON expression: ${expression}. ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return new CronExpression(expression.trim());
    }
    getNextOccurrence(from = new Date()) {
        const interval = (0, cron_parser_1.parseExpression)(this.expression, {
            currentDate: from,
            tz: 'UTC'
        });
        return interval.next().toDate();
    }
    getNextOccurrences(count, from = new Date()) {
        const interval = (0, cron_parser_1.parseExpression)(this.expression, {
            currentDate: from,
            tz: 'UTC'
        });
        const occurrences = [];
        for (let i = 0; i < count; i++) {
            occurrences.push(interval.next().toDate());
        }
        return occurrences;
    }
    getOccurrencesBetween(startDate, endDate) {
        const interval = (0, cron_parser_1.parseExpression)(this.expression, {
            currentDate: startDate,
            endDate: endDate,
            tz: 'UTC'
        });
        const occurrences = [];
        try {
            while (true) {
                const next = interval.next();
                occurrences.push(next.toDate());
            }
        }
        catch (error) {
            // End of iteration
        }
        return occurrences;
    }
    getValue() {
        return this.expression;
    }
    equals(other) {
        return this.expression === other.expression;
    }
    toString() {
        return this.expression;
    }
}
exports.CronExpression = CronExpression;
//# sourceMappingURL=CronExpression.js.map