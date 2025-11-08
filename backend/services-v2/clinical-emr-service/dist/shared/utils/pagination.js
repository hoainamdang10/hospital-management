"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.getRange = getRange;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
function parsePagination(query) {
    const page = Math.max(DEFAULT_PAGE, Math.min(Number.parseInt(query.page ?? `${DEFAULT_PAGE}`, 10) ||
        DEFAULT_PAGE, 10000));
    const rawLimit = Number.parseInt(query.limit ?? `${DEFAULT_LIMIT}`, 10) ||
        DEFAULT_LIMIT;
    const limit = Math.max(1, Math.min(rawLimit, MAX_LIMIT));
    return { page, limit };
}
function getRange({ page, limit }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { from, to };
}
