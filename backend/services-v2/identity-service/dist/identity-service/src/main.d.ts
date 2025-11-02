/**
 * Identity Service - Main Application (Refactored)
 * Production-ready service with modular bootstrap architecture
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Production-Ready, HIPAA-Compliant
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                roles: string[];
                permissions: string[];
            };
        }
    }
}
/**
 * Bootstrap application
 * Orchestrates service initialization using modular bootstrap architecture
 */
declare function bootstrap(): Promise<void>;
export { bootstrap };
export default bootstrap;
//# sourceMappingURL=main.d.ts.map