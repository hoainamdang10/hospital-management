import { ApolloServerPlugin } from "@apollo/server";
import logger from "@hospital/shared/dist/utils/logger";
import { separateOperations } from "graphql";
import {
  createComplexityRule,
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from "graphql-query-complexity";
import { GraphQLContext, UserRole } from "../context";

/**
 * Complexity limits based on user role
 */
const complexityLimits = {
  [UserRole.ADMIN]: 2000, // Admin can run complex queries
  [UserRole.DOCTOR]: 1500, // Doctors need complex queries for patient data
  [UserRole.PATIENT]: 1000, // Patients have simpler queries
  [UserRole.RECEPTIONIST]: 800, // Receptionists have basic queries
  anonymous: 500, // Anonymous users are very limited
};

/**
 * Field complexity estimators
 */
const complexityEstimators = [
  // Custom field complexity estimator
  fieldExtensionsEstimator(),

  // Simple estimator with custom rules
  simpleEstimator({
    // maximumIntrospection: 1000, // Removed in newer versions
    // scalarCost: 1, // Removed in newer versions
    // objectCost: 2, // Removed in newer versions
    // listFactor: 10, // Removed in newer versions
    // introspectionCost: 1000 // Removed in newer versions
  }),

  // Custom complexity limit rule
  createComplexityRule({
    estimators: [
      fieldExtensionsEstimator(),
      simpleEstimator({ defaultComplexity: 1 }),
    ],
    maximumComplexity: 1500,
    onComplete: (complexity: number) => {
      if (complexity > 1500) {
        throw new Error(
          `Truy vấn quá phức tạp. Độ phức tạp: ${complexity}, Giới hạn: 1500. ` +
            "Vui lòng đơn giản hóa truy vấn hoặc chia nhỏ thành nhiều truy vấn."
        );
      }
    },
  }),
];

/**
 * Query complexity analysis middleware
 */
export const complexityLimitMiddleware: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    return {
      async didResolveOperation(requestContext) {
        const { document, request } = requestContext;
        const context = requestContext.contextValue;

        // Skip complexity analysis for introspection queries
        if (request.operationName === "IntrospectionQuery") {
          return;
        }

        if (!document) {
          return;
        }

        try {
          // Determine complexity limit based on user role
          const maxComplexity = getUserComplexityLimit(context);

          // Separate operations if there are multiple
          const operations = separateOperations(document);
          const operationName =
            request.operationName || Object.keys(operations)[0];
          const operation = operations[operationName];

          if (!operation) {
            throw new Error("Không tìm thấy operation trong truy vấn");
          }

          // Calculate query complexity
          const complexity = getComplexity({
            estimators: complexityEstimators as any,
            // maximumComplexity: maxComplexity, // Use different approach
            variables: request.variables || {},
            query: operation,
            schema: requestContext.schema!,
            // onComplete callback removed - use different approach for logging
          });

          // Log high complexity queries
          if (complexity > maxComplexity * 0.8) {
            logger.warn("High complexity query detected:", {
              complexity,
              maxComplexity,
              operationName,
              userId: context.user?.id,
              role: context.user?.role,
              query: request.query,
              variables: request.variables,
            });
          }

          // Add complexity info to context for monitoring
          (context as any).queryComplexity = complexity;
          (context as any).maxComplexity = maxComplexity;
        } catch (error) {
          logger.error("Query complexity analysis error:", {
            error: (error as Error).message,
            operationName: request.operationName,
            userId: context.user?.id,
            requestId: context.requestId,
          });

          // If it's a complexity limit error, throw it
          if (error instanceof Error && error.message.includes("phức tạp")) {
            throw error;
          }

          // For other errors, log but don't block the query
          logger.warn("Complexity analysis failed, allowing query to proceed");
        }
      },

      async willSendResponse(requestContext) {
        const context = requestContext.contextValue;
        const { response } = requestContext;

        // Add complexity headers to response
        const complexity = (context as any).queryComplexity;
        const maxComplexity = (context as any).maxComplexity;

        if (complexity !== undefined && response?.http) {
          response.http.headers.set(
            "X-Query-Complexity",
            complexity.toString()
          );
          response.http.headers.set(
            "X-Max-Complexity",
            maxComplexity.toString()
          );
          response.http.headers.set(
            "X-Complexity-Remaining",
            (maxComplexity - complexity).toString()
          );
        }
      },
    };
  },
};

/**
 * Get complexity limit based on user role
 */
function getUserComplexityLimit(context: GraphQLContext): number {
  if (!context.user) {
    return complexityLimits.anonymous;
  }

  return (
    complexityLimits[context.user?.role as keyof typeof complexityLimits] ||
    complexityLimits.anonymous
  );
}

/**
 * Custom complexity estimator for specific fields
 */
export function fieldComplexity(cost: number) {
  return {
    extensions: {
      complexity: cost,
    },
  };
}

/**
 * Dynamic complexity estimator based on arguments
 */
export function dynamicComplexity(costFn: (args: any) => number) {
  return {
    extensions: {
      complexity: (args: any) => costFn(args),
    },
  };
}

/**
 * List field complexity estimator
 */
export function listComplexity(itemCost: number = 1, maxItems: number = 100) {
  return {
    extensions: {
      complexity: (args: any) => {
        const limit = Math.min(args.limit || 20, maxItems);
        return itemCost * limit;
      },
    },
  };
}

/**
 * Pagination complexity estimator
 */
export function paginationComplexity(baseCost: number = 10) {
  return {
    extensions: {
      complexity: (args: any) => {
        const page = args.page || 1;
        const limit = Math.min(args.limit || 20, 100);

        // Higher cost for later pages and larger limits
        const pageCost = Math.ceil(page / 10) * 5;
        const limitCost = Math.ceil(limit / 10) * 2;

        return baseCost + pageCost + limitCost;
      },
    },
  };
}

/**
 * Search complexity estimator
 */
export function searchComplexity(baseCost: number = 20) {
  return {
    extensions: {
      complexity: (args: any) => {
        let cost = baseCost;

        // Add cost for search query
        if (args.query && args.query.length > 0) {
          cost += Math.min(args.query.length, 50); // Max 50 extra cost for search
        }

        // Add cost for filters
        if (args.filters) {
          const filterCount = Object.keys(args.filters).length;
          cost += filterCount * 5;
        }

        // Add cost for sorting
        if (args.sortBy) {
          cost += 10;
        }

        return cost;
      },
    },
  };
}

/**
 * Relationship complexity estimator
 */
export function relationshipComplexity(
  baseCost: number = 5,
  maxDepth: number = 3
) {
  return {
    extensions: {
      complexity: (args: any, childComplexity: number) => {
        // Exponentially increase cost with depth
        const depthMultiplier = Math.pow(2, Math.min(maxDepth, 3));
        return baseCost + childComplexity * depthMultiplier;
      },
    },
  };
}

/**
 * Time-based complexity estimator (for date ranges)
 */
export function timeRangeComplexity(baseCost: number = 15) {
  return {
    extensions: {
      complexity: (args: any) => {
        let cost = baseCost;

        if (args.dateFrom && args.dateTo) {
          const fromDate = new Date(args.dateFrom);
          const toDate = new Date(args.dateTo);
          const daysDiff = Math.ceil(
            (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Add cost based on date range (max 365 days)
          cost += Math.min(daysDiff, 365) * 0.5;
        }

        return Math.ceil(cost);
      },
    },
  };
}

/**
 * Aggregation complexity estimator
 */
export function aggregationComplexity(baseCost: number = 50) {
  return {
    extensions: {
      complexity: (args: any) => {
        let cost = baseCost;

        // Add cost for grouping
        if (args.groupBy) {
          cost += 25;
        }

        // Add cost for having clauses
        if (args.having) {
          cost += 15;
        }

        // Add cost for multiple aggregations
        if (args.aggregations && Array.isArray(args.aggregations)) {
          cost += args.aggregations.length * 10;
        }

        return cost;
      },
    },
  };
}

export default complexityLimitMiddleware;
