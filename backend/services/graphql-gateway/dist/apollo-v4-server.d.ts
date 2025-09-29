import { ApolloServer } from '@apollo/server';
import http from 'http';
import { GraphQLContext } from './context';
declare function startServer(): Promise<{
    server: ApolloServer<GraphQLContext>;
    app: import("express-serve-static-core").Express;
    httpServer: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
}>;
export { startServer };
//# sourceMappingURL=apollo-v4-server.d.ts.map