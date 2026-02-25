import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface PublicPage {
  id: string;
  cabinet_id: string;
  slug: string;
  status: 'draft' | 'published' | 'hidden';
  welcome_text?: string;
  theme: {
    primary: string;
    secondary: string;
    mode: 'light' | 'dark';
  };
  links: {
    instagram?: string;
    whatsapp?: string;
    site?: string;
  };
  show_sections: {
    kpis: boolean;
    timeline: boolean;
    form: boolean;
  };
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export const usePublicPage = () => {
  const { cabinet } = useAuthContext();
  const [publicPage, setPublicPage] = useState<PublicPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cabinet?.cabinet_id) {
      loadPublicPage();
    }
  }, [cabinet?.cabinet_id]);

  const loadPublicPage = async () => {
    if (!cabinet?.cabinet_id) return;
    
    try {
      const { data, error } = await supabase
        .from('public_pages')
        .select('*')
        .eq('cabinet_id', cabinet.cabinet_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setPublicPage(data as PublicPage);
    } catch (error) {
      console.error('Erro ao carregar página pública:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPublicPage = async (cabinetName: string) => {
    if (!cabinet?.cabinet_id) {
      toast.error('Gabinete não identificado');
      return false;
    }

    try {
      // Gerar slug único
      const baseSlug = `vereador${cabinetName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')}`;
      
      const { data, error } = await supabase
        .from('public_pages')
        .insert({
          cabinet_id: cabinet.cabinet_id,
          slug: baseSlug,
          status: 'draft',
          welcome_text: `Bem-vindo à página oficial do ${cabinetName}`,
          theme: {
            primary: '#5B6BFF',
            secondary: '#8A5BFF',
            mode: 'light'
          },
          links: {},
          show_sections: {
            kpis: true,
            timeline: true,
            form: true
          }
        })
        .select()
        .single();

      if (error) throw error;

      setPublicPage(data as PublicPage);
      toast.success('Página pública criada com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao criar página pública:', error);
      if (error.code === '23505') {
        toast.error('Já existe uma página com este slug');
      } else {
        toast.error('Erro ao criar página pública');
      }
      return false;
    }
  };

  const updatePublicPage = async (updates: Partial<PublicPage>) => {
    if (!publicPage) {
      toast.error('Página não encontrada');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('public_pages')
        .update(updates)
        .eq('id', publicPage.id)
        .select()
        .single();

      if (error) throw error;

      setPublicPage(data as PublicPage);
      toast.success('Página atualizada com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar página:', error);
      toast.error('Erro ao atualizar página');
      return false;
    }
  };

  const publishPage = async () => {
    return updatePublicPage({ 
      status: 'published',
      published_at: new Date().toISOString()
    });
  };

  const hidePage = async () => {
    return updatePublicPage({ status: 'hidden' });
  };

  return {
    publicPage,
    loading,
    createPublicPage,
    updatePublicPage,
    publishPage,
    hidePage,
    refreshPage: loadPublicPage
  };
};