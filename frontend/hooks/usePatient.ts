/**
 * usePatient Hook
 * Get patient information from authenticated user
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { getPatientByUserId, type Patient } from '@/lib/api/patient.service';

export function usePatient() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPatientRole = useMemo(() => user?.role?.toUpperCase() === 'PATIENT', [user?.role]);

  useEffect(() => {
    if (user?.userId && isPatientRole) {
      loadPatient();
      return;
    }

    // Non-patient roles shouldn't call patient API
    setPatient(null);
    setError(null);
    setIsLoading(false);
  }, [user?.userId, isPatientRole]);

  const loadPatient = async () => {
    if (!user?.userId || !isPatientRole) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const patientData = await getPatientByUserId(user.userId);
      setPatient(patientData);
    } catch (err: any) {
      console.error('[usePatient] Failed to load patient:', err);
      setError(err.message || 'Failed to load patient information');
      setPatient(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    patient: isPatientRole ? patient : null,
    patientId: isPatientRole ? patient?.patientId || null : null,
    internalId: isPatientRole ? patient?.id || null : null,
    isLoading,
    error,
    reload: loadPatient,
  };
}
