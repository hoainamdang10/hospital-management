"use strict";
/**
 * Provider Staff Service - Main Entry Point
 * Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
// Infrastructure
const SupabaseProviderStaffRepository_1 = require("./infrastructure/repositories/SupabaseProviderStaffRepository");
// Application
const RegisterStaffUseCase_1 = require("./application/use-cases/RegisterStaffUseCase");
const GetStaffProfileUseCase_1 = require("./application/use-cases/GetStaffProfileUseCase");
// Presentation
const StaffController_1 = require("./presentation/controllers/StaffController");
const staffRoutes_1 = require("./presentation/routes/staffRoutes");
// Load environment variables
dotenv_1.default.config();
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
async function bootstrap() {
    try {
        // Create Express app
        const app = (0, express_1.default)();
        // Middleware
        app.use((0, helmet_1.default)());
        app.use((0, cors_1.default)());
        app.use((0, compression_1.default)());
        app.use(express_1.default.json());
        app.use(express_1.default.urlencoded({ extended: true }));
        // Initialize repository
        const staffRepository = new SupabaseProviderStaffRepository_1.SupabaseProviderStaffRepository(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        // Initialize use cases
        const registerStaffUseCase = new RegisterStaffUseCase_1.RegisterStaffUseCase(staffRepository);
        const getStaffProfileUseCase = new GetStaffProfileUseCase_1.GetStaffProfileUseCase(staffRepository);
        // Initialize controller
        const staffController = new StaffController_1.StaffController(registerStaffUseCase, getStaffProfileUseCase);
        // Health check endpoint
        app.get('/health', (req, res) => staffController.healthCheck(req, res));
        // API routes
        app.use('/api/staff', (0, staffRoutes_1.createStaffRoutes)(staffController));
        // Error handling middleware
        app.use((err, _req, res, _next) => {
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
    }
    catch (error) {
        console.error('Failed to bootstrap application:', error);
        process.exit(1);
    }
}
// Start the application
bootstrap();
//# sourceMappingURL=main.js.map