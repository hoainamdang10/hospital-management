/**
 * Provider Staff Service - Main Entry Point
 * Clean Architecture + DDD Implementation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Infrastructure
import { SupabaseProviderStaffRepository } from './infrastructure/repositories/SupabaseProviderStaffRepository';

// Application
import { RegisterStaffUseCase } from './application/use-cases/RegisterStaffUseCase';
import { GetStaffProfileUseCase } from './application/use-cases/GetStaffProfileUseCase';

// Presentation
import { StaffController } from './presentation/controllers/StaffController';
import { createStaffRoutes } from './presentation/routes/staffRoutes';

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3003;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

/**
 * Bootstrap the application
 */
async function bootstrap(): Promise<void> {
  try {
    // Create Express app
    const app: Application = express();

    // Middleware
    app.use(helmet());
    app.use(cors());
    app.use(compression());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Initialize repository
    const staffRepository = new SupabaseProviderStaffRepository(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY
    );

    // Initialize use cases
    const registerStaffUseCase = new RegisterStaffUseCase(staffRepository);
    const getStaffProfileUseCase = new GetStaffProfileUseCase(staffRepository);

    // Initialize controller
    const staffController = new StaffController(
      registerStaffUseCase,
      getStaffProfileUseCase
    );

    // Health check endpoint
    app.get('/health', (req, res) => staffController.healthCheck(req, res));

    // API routes
    app.use('/api/staff', createStaffRoutes(staffController));

    // Error handling middleware
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Provider Staff Service running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🏥 API endpoint: http://localhost:${PORT}/api/staff`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('Failed to bootstrap application:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();

