/**
 * Dashboard route mapping for different user roles
 * This ensures consistent routing across the application
 */

export type UserRole = 'admin' | 'doctor' | 'patient' | 'staff' | 'receptionist' | 'superadmin'

/**
 * Get the dashboard path for a given user role
 */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'doctor':
      return '/doctors/dashboard'
    case 'patient':
      return '/patient/dashboard'
    case 'admin':
    case 'superadmin':
      return '/admin/dashboard'
    case 'staff':
    case 'receptionist':
      return '/staff/dashboard'
    default:
      return '/auth/login'
  }
}

/**
 * Get the profile path for a given user role
 */
export function getProfilePath(role: UserRole): string {
  switch (role) {
    case 'doctor':
      return '/doctors/profile'
    case 'patient':
      return '/patient/profile'
    case 'admin':
      return '/admin/settings' // Admin doesn't have a profile page, use settings
    default:
      return '/auth/login'
  }
}

/**
 * Get the settings path for a given user role
 */
export function getSettingsPath(role: UserRole): string {
  switch (role) {
    case 'doctor':
      return '/doctors/settings'
    case 'patient':
      return '/patient/settings'
    case 'admin':
      return '/admin/settings'
    default:
      return '/auth/login'
  }
}

/**
 * Check if a path is valid for a given role
 */
export function isValidPathForRole(path: string, role: UserRole): boolean {
  const rolePrefix = getRolePrefix(role)
  return path.startsWith(rolePrefix)
}

/**
 * Get the URL prefix for a given role
 */
export function getRolePrefix(role: UserRole): string {
  switch (role) {
    case 'doctor':
      return '/doctors'
    case 'patient':
      return '/patient'
    case 'admin':
      return '/admin'
    default:
      return '/auth'
  }
}

/**
 * Get all available routes for a given role
 */
export function getAvailableRoutes(role: UserRole): string[] {
  const prefix = getRolePrefix(role)
  
  switch (role) {
    case 'doctor':
      return [
        `${prefix}/dashboard`,
        `${prefix}/profile`,
        `${prefix}/schedule`,
        `${prefix}/appointments`,
        `${prefix}/patients`,
        `${prefix}/settings`
      ]
    case 'patient':
      return [
        `${prefix}/dashboard`,
        `${prefix}/profile`,
        `${prefix}/appointments`,
        `${prefix}/medical-records`,
        `${prefix}/health-tracking`,
        `${prefix}/settings`
      ]
    case 'admin':
      return [
        `${prefix}/dashboard`,
        `${prefix}/doctors`,
        `${prefix}/patients`,
        `${prefix}/appointments`,
        `${prefix}/departments`,
        `${prefix}/rooms`,
        `${prefix}/reports`,
        `${prefix}/settings`
      ]
    default:
      return ['/auth/login']
  }
}
