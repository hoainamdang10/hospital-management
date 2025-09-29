// Auth API exports - now using Auth Service
export { authServiceApi as authApi } from "../api/auth";
export type {
  AuthResponse,
  AuthUser as HospitalUser,
  LoginCredentials,
  RegisterData,
} from "../api/auth";

// Export client-side auth guard hook
export {
  useAdminGuard,
  useAuthGuard,
  useDoctorGuard,
  usePatientGuard,
  withAuthGuard,
} from "../../hooks/useAuthGuard";

// Export client-side RLS helpers
export { clientRLS } from "./rls-helpers";

// Note: Server-side authentication is now handled by middleware.ts
// Use client-side auth guards for component-level protection
