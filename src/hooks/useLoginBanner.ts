import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LoginBanner {
  id: string;
  imagem_url: string;
  link_botao?: string;
  link_destino?: string;
  ativo: boolean;
  titulo?: string;
}

export const useLoginBanner = () => {
  const [banner, setBanner] = useState<LoginBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoginBanner();
  }, []);

  const fetchLoginBanner = async () => {
    try {
      const { data, error } = await supabase
        .from('comunicados')
        .select('*')
        .eq('ativo', true)
        .eq('tipo', 'login')
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching login banner:', error);
      } else {
        setBanner(data);
      }
    } catch (error) {
      console.error('Error fetching login banner:', error);
    } finally {
      setLoading(false);
    }
  };

  return { banner, loading, refetch: fetchLoginBanner };
};