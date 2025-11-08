export type UserRole = 'doctor' | 'nurse' | 'admin' | 'patient';

export interface UserContext {
  id: string;
  role: UserRole;
  patientId?: string;
}
