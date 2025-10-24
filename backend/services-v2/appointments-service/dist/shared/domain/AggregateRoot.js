"use strict";
/**
 * Aggregate Root Base Class
 * Clean Architecture + DDD Implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const Entity_1 = require("./Entity");
class AggregateRoot extends Entity_1.Entity {
    constructor(props) {
        super(props);
        this._domainEvents = [];
    }
    addDomainEvent(domainEvent) {
        this._domainEvents.push(domainEvent);
    }
    getDomainEvents() {
        return this._domainEvents.slice();
    }
    clearDomainEvents() {
        this._domainEvents = [];
    }
    hasDomainEvents() {
        return this._domainEvents.length > 0;
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=AggregateRoot.js.map