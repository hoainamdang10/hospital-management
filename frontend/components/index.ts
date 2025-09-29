// Legacy Layout components removed - use Universal Layout instead

// Universal Layout Components (New)
export * from './layout/UniversalSidebar';
export * from './layout/UniversalLayout';
export * from './layout/SidebarConfig';

// Data display components
export * from './data-display/StatusBadge';
export * from './data-display/DataTable';
export * from './data-display/TableSkeleton';
export * from './data-display/SearchableDataTable';

// Supabase-specific data display components
export * from './data-display/SupabaseDoctorsTable';
export * from './data-display/SupabasePatientsTable';
export * from './data-display/SupabaseAppointmentsTable';
export * from './data-display/SupabaseRoomsTable';
export * from './data-display/SupabaseSearchableTable';

// Dialog components
export * from './dialogs/ConfirmDeleteDialog';

// Feedback components
export * from './feedback/LoadingIndicator';

// Common components
export * from './common/LoadingSpinner';

// Input components
export * from './inputs/SearchBar';

// Re-export shared components
export * from './shared-components';

// Re-export UI components
export * from './ui/button';
export * from './ui/input';
export * from './ui/select';
export * from './ui/dialog';
export * from './ui/badge';
export * from './ui/avatar';
export * from './ui/card';
export * from './ui/label';
export * from './ui/alert';
export * from './ui/toast';
export * from './ui/toast-provider';
