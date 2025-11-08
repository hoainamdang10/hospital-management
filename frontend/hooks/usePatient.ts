/**
 * usePatient Hook
 * Get patient information from authenticated user
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getPatientByUserId, type Patient } from '@/lib/api/patient.service';

export function usePatient() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadPatient();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadPatient = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const patientData = await getPatientByUserId(user.id);
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
    patient,
    patientId: patient?.patientId || null,
    isLoading,
    error,
    reload: loadPatient,
  };
}
