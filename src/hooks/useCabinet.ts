import { useAuthContext } from '@/components/AuthProvider';

interface CabinetInfo {
  cabinet_id: string;
  cabinet_name: string;
  city_name?: string;
  user_role: string;
}

export const useCabinet = () => {
  const { cabinet, cabinetLoading } = useAuthContext();

  return {
    cabinet,
    loading: cabinetLoading,
    refetch: () => {
      console.log('Refetch requested - controlled by AuthProvider');
    },
  };
};