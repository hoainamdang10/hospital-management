/**
 * Combined GraphQL Schema
 * Merges all entity schemas with base schema
 */
export declare const typeDefs: import("graphql").DocumentNode[];
/**
 * Schema validation and documentation
 */
export declare const schemaInfo: {
    version: string;
    description: string;
    entities: {
        name: string;
        description: string;
        fields: number;
        queries: number;
        mutations: number;
        subscriptions: number;
    }[];
    features: string[];
    totalQueries: number;
    totalMutations: number;
    totalSubscriptions: number;
    totalTypes: number;
    totalEnums: number;
    totalScalars: number;
};
export default typeDefs;
//# sourceMappingURL=index.d.ts.map