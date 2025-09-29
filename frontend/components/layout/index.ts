// Universal Sidebar Components
export { UniversalSidebar } from './UniversalSidebar';
export type { UniversalSidebarProps } from './UniversalSidebar';

// Universal Layout Components
export {
  UniversalLayout,
  AdminLayout,
  DoctorLayout,
  PatientLayout,
  useSidebarConfig,
  ExampleUsage
} from './UniversalLayout';
export type {
  UniversalLayoutProps,
  AdminLayoutProps,
  DoctorLayoutProps,
  PatientLayoutProps
} from './UniversalLayout';

// Sidebar Configuration
export {
  getSidebarConfig,
  adminSidebarConfig,
  doctorSidebarConfig,
  patientSidebarConfig
} from './SidebarConfig';
export type {
  MenuItem,
  MenuSection,
  SidebarBranding,
  SidebarConfig
} from './SidebarConfig';

// Legacy Layout Components - use Universal Layout instead
export { DashboardLayout } from './DashboardLayout';
export { default as PublicLayout } from './PublicLayout';
export { RoleBasedLayout } from './RoleBasedLayout';
export { UserMenu } from './UserMenu';

// Legacy types removed - use Universal Layout types instead