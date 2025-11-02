"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RRuleExpression = void 0;
const rrule_1 = require("rrule");
class RRuleExpression {
    constructor(expression) {
        this.expression = expression;
        this.rrule = (0, rrule_1.rrulestr)(expression);
    }
    static create(expression) {
        if (!expression || expression.trim().length === 0) {
            throw new Error('RRULE expression cannot be empty');
        }
        const trimmed = expression.trim();
        // Validate FREQ is present
        if (!trimmed.includes('FREQ=')) {
            throw new Error(`Invalid RRULE expression: ${expression}. FREQ is required`);
        }
        try {
            (0, rrule_1.rrulestr)(trimmed);
        }
        catch (error) {
            throw new Error(`Invalid RRULE expression: ${expression}. ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return new RRuleExpression(trimmed);
    }
    getNextOccurrence(from = new Date()) {
        const next = this.rrule.after(from, true);
        return next;
    }
    getNextOccurrences(count, from = new Date()) {
        return this.rrule.all((date, i) => {
            return date >= from && i < count;
        });
    }
    getOccurrencesBetween(startDate, endDate) {
        return this.rrule.between(startDate, endDate, true);
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
exports.RRuleExpression = RRuleExpression;
//# sourceMappingURL=RRuleExpression.js.map