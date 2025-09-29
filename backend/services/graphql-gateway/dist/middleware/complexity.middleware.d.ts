import { ApolloServerPlugin } from "@apollo/server";
import { GraphQLContext } from "../context";
/**
 * Query complexity analysis middleware
 */
export declare const complexityLimitMiddleware: ApolloServerPlugin<GraphQLContext>;
/**
 * Custom complexity estimator for specific fields
 */
export declare function fieldComplexity(cost: number): {
    extensions: {
        complexity: number;
    };
};
/**
 * Dynamic complexity estimator based on arguments
 */
export declare function dynamicComplexity(costFn: (args: any) => number): {
    extensions: {
        complexity: (args: any) => number;
    };
};
/**
 * List field complexity estimator
 */
export declare function listComplexity(itemCost?: number, maxItems?: number): {
    extensions: {
        complexity: (args: any) => number;
    };
};
/**
 * Pagination complexity estimator
 */
export declare function paginationComplexity(baseCost?: number): {
    extensions: {
        complexity: (args: any) => number;
    };
};
/**
 * Search complexity estimator
 */
export declare function searchComplexity(baseCost?: number): {
    extensions: {
        complexity: (args: any) => number;
    };
};
/**
 * Relationship complexity estimator
 */
export declare function relationshipComplexity(baseCost?: number, maxDepth?: number): {
    extensions: {
        complexity: (args: any, childComplexity: number) => number;
    };
};
/**
 * Time-based complexity estimator (for date ranges)
 */
export declare function timeRangeComplexity(baseCost?: number): {
    extensions: {
        complexity: (args: any) => number;
    };
};
/**
 * Aggregation complexity estimator
 */
export declare function aggregationComplexity(baseCost?: number): {
    extensions: {
        complexity: (args: any) => number;
    };
};
export default complexityLimitMiddleware;
//# sourceMappingURL=complexity.middleware.d.ts.map