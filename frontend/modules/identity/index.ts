/**
 * Identity Module Exports
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

// Components
export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';
export { UserProfile } from './components/UserProfile';
export { StaffActivationForm } from './components/StaffActivationForm';
export { ProvisionStaffForm } from './components/ProvisionStaffForm';

// Hooks
export { useAuth } from './hooks/useAuth';

// Services
export * as identityService from './services/identityService';

// Types
export type * from './types';

