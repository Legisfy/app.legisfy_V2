import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
}

export const useCurrentUser = () => {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile({
        id: user.id,
        user_id: user.id,
        full_name: data?.full_name || null,
        email: user.email || ''
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to just user data
      setProfile({
        id: user.id,
        user_id: user.id,
        full_name: null,
        email: user.email || ''
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (!profile) return 'Carregando...';
    return profile.full_name || profile.email.split('@')[0] || 'Usuário';
  };

  return {
    profile,
    loading,
    getDisplayName
  };
};