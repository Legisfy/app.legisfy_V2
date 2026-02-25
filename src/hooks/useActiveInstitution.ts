import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/AuthProvider';

interface ActiveInstitution {
  cabinet_id: string;
  cabinet_name: string;
  city_name?: string;
  institution_name?: string;
  chamber_type?: string;
  politician_name?: string;
  user_role: string;
}

export const useActiveInstitution = () => {
  const { cabinet, cabinetLoading } = useAuthContext();
  const [availableInstitutions, setAvailableInstitutions] = useState<ActiveInstitution[]>([]);

  useEffect(() => {
    if (cabinet) {
      setAvailableInstitutions([cabinet as any]);
    } else {
      setAvailableInstitutions([]);
    }
  }, [cabinet]);

  return {
    activeInstitution: cabinet,
    availableInstitutions,
    loading: cabinetLoading,
    error: null,
    setActiveInstitution: (id: string) => console.log('Change requested for:', id),
    refetch: () => console.log('Refetch requested - controlled by AuthProvider')
  };
};
