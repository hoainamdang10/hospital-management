'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Backward-compat route: /auth/activate?token=...
 * Redirects to /auth/activate-staff to reuse the existing activation flow.
 */
export default function ActivateRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams?.get('token');
    const target = token
      ? `/auth/activate-staff?token=${encodeURIComponent(token)}`
      : '/auth/activate-staff';
    router.replace(target);
  }, [router, searchParams]);

  return null;
}
