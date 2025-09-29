import dotenv from 'dotenv';
import { createApp } from './app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3100;
const DOCTOR_ONLY_MODE = process.env.DOCTOR_ONLY_MODE === 'true';

async function startServer() {
  try {
    console.log('Starting API Gateway...');

    if (DOCTOR_ONLY_MODE) {
      console.log('🏥 Running in DOCTOR-ONLY MODE for development');
      console.log('📝 Other services are disabled and will return 503');
    }

    // Create Express app
    const app = await createApp();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 API Gateway running on port ${PORT}`);
      console.log(`📚 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 API Gateway: http://localhost:${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/docs`);

      if (DOCTOR_ONLY_MODE) {
        console.log(`🏥 Mode: Doctor Service Development Only`);
        console.log(`👨‍⚕️ Doctor API: http://localhost:${PORT}/api/doctors`);
        console.log(`🔧 Service Status: http://localhost:${PORT}/services`);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully`);
      server.close(() => {
        console.log('API Gateway stopped');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

startServer();
