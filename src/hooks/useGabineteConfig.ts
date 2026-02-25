import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/components/AuthProvider";

export const useGabineteConfig = () => {
  const { user, cabinet } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [gabineteData, setGabineteData] = useState<any>(null);

  useEffect(() => {
    if (cabinet?.cabinet_id) {
      loadGabineteData();
    }
  }, [cabinet?.cabinet_id]);

  const loadGabineteData = async () => {
    if (!cabinet?.cabinet_id) return;

    try {
      const { data, error } = await supabase
        .from('gabinetes')
        .select('*')
        .eq('id', cabinet.cabinet_id)
        .single();

      if (error) throw error;
      setGabineteData(data);
    } catch (error) {
      console.error('Erro ao carregar dados do gabinete:', error);
      toast.error('Erro ao carregar configurações do gabinete');
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!cabinet?.cabinet_id || !user) {
      toast.error('Gabinete não identificado');
      return null;
    }

    setLogoUploading(true);

    try {
      // Upload para o bucket gabinete-logos
      const fileExt = file.name.split('.').pop();
      const fileName = `${cabinet.cabinet_id}/logo.${fileExt}`;

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('gabinete-logos')
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gabinete-logos')
        .getPublicUrl(fileName);

      // Add cache-buster timestamp to URL so browser always fetches fresh image
      const logoUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      // Update gabinete record with timestamped URL to bust cache across pages
      const { error: updateError } = await supabase
        .from('gabinetes')
        .update({ logomarca_url: logoUrlWithTimestamp })
        .eq('id', cabinet.cabinet_id);

      if (updateError) throw updateError;

      console.log('✅ Logo URL saved to database:', logoUrlWithTimestamp);

      // Update local data
      setGabineteData(prev => ({ ...prev, logomarca_url: logoUrlWithTimestamp }));

      toast.success('Logomarca atualizada com sucesso!');

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('gabinete-logo-updated', {
        detail: { logoUrl: logoUrlWithTimestamp }
      }));

      // Reload gabinete data to ensure all components update
      await loadGabineteData();

      return logoUrlWithTimestamp;
    } catch (error: any) {
      console.error('Erro ao fazer upload da logomarca:', error);
      toast.error('Erro ao fazer upload da logomarca: ' + error.message);
      return null;
    } finally {
      setLogoUploading(false);
    }
  };

  const updateGabineteInfo = async (data: { nome?: string }) => {
    if (!cabinet?.cabinet_id) {
      toast.error('Gabinete não identificado');
      return false;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('gabinetes')
        .update(data)
        .eq('id', cabinet.cabinet_id);

      if (error) throw error;

      setGabineteData(prev => ({ ...prev, ...data }));

      // Se o nome foi alterado, recarregar dados do contexto
      if (data.nome) {
        // Reload cabinet data without page refresh
        loadGabineteData();
      }

      toast.success('Configurações salvas com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar gabinete:', error);
      toast.error('Erro ao salvar configurações: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    gabineteData,
    loading,
    logoUploading,
    uploadLogo,
    updateGabineteInfo,
    reloadData: loadGabineteData
  };
};