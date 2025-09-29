import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { buildSchema } from 'graphql';
import { GraphQLContext } from './context';
import { createContext } from './context';
import { authMiddleware } from './middleware/auth.middleware';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';
import { complexityLimitMiddleware } from './middleware/complexity.middleware';
import { i18nPlugin } from './middleware/i18n.middleware';
import logger from '@hospital/shared/dist/utils/logger';

// Import the fixed schema and resolvers
import { typeDefs } from './schema/index';
import { resolvers } from './resolvers/index';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Apollo Server v4 setup
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      authMiddleware,
      rateLimitMiddleware,
      // complexityLimitMiddleware, // Temporarily disabled due to type issues
      i18nPlugin
    ],
    introspection: process.env.NODE_ENV !== 'production',
    includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production'
  });

  await server.start();

  // Middleware
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false
  }));

  app.use(morgan('combined'));

  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  }));

  // JSON middleware for parsing request bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // GraphQL endpoint
  app.use('/graphql', expressMiddleware(server, {
    context: createContext
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
  
  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, () => {
      logger.info(`🚀 GraphQL Gateway ready at http://localhost:${PORT}/graphql`);
      logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
      resolve();
    });
  });

  return { server, app, httpServer };
}

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Failed to start GraphQL Gateway:', error);
    process.exit(1);
  });
}

export { startServer };
