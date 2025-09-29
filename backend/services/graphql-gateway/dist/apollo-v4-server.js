"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const context_1 = require("./context");
const auth_middleware_1 = require("./middleware/auth.middleware");
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const i18n_middleware_1 = require("./middleware/i18n.middleware");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
// Import the fixed schema and resolvers
const index_1 = require("./schema/index");
const index_2 = require("./resolvers/index");
async function startServer() {
    const app = (0, express_1.default)();
    const httpServer = http_1.default.createServer(app);
    // Apollo Server v4 setup
    const server = new server_1.ApolloServer({
        typeDefs: index_1.typeDefs,
        resolvers: index_2.resolvers,
        plugins: [
            (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
            auth_middleware_1.authMiddleware,
            rateLimit_middleware_1.rateLimitMiddleware,
            // complexityLimitMiddleware, // Temporarily disabled due to type issues
            i18n_middleware_1.i18nPlugin
        ],
        introspection: process.env.NODE_ENV !== 'production',
        includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production'
    });
    await server.start();
    // Middleware
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
        crossOriginEmbedderPolicy: false
    }));
    app.use((0, morgan_1.default)('combined'));
    app.use((0, cors_1.default)({
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true
    }));
    // JSON middleware for parsing request bodies
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // GraphQL endpoint
    app.use('/graphql', (0, express4_1.expressMiddleware)(server, {
        context: context_1.createContext
    }));
    // Root endpoint - service info
    app.get('/', (req, res) => {
        res.json({
            service: 'GraphQL Gateway',
            version: '1.0.0',
            graphql: '/graphql',
            health: '/health',
            environment: process.env.NODE_ENV || 'development',
            status: 'running'
        });
    });
    // Health check
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            service: 'GraphQL Gateway',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    });
    // Start server
    const PORT = process.env.PORT || 3200;
    await new Promise((resolve) => {
        httpServer.listen(PORT, () => {
            logger_1.default.info(`🚀 GraphQL Gateway ready at http://localhost:${PORT}/graphql`);
            logger_1.default.info(`📊 Health check available at http://localhost:${PORT}/health`);
            resolve();
        });
    });
    return { server, app, httpServer };
}
// Start the server
if (require.main === module) {
    startServer().catch((error) => {
        logger_1.default.error('Failed to start GraphQL Gateway:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=apollo-v4-server.js.map