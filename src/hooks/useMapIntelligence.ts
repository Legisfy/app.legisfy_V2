import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface MapPin {
  id: string;
  cabinet_id: string;
  lat: number;
  lng: number;
  comment?: string;
  created_at: string;
  created_by?: string;
}

export interface MapRegional {
  id: string;
  cabinet_id: string;
  name: string;
  color: string;
  coordinates: [number, number][]; // Array of [lng, lat]
  created_at: string;
}

export const useMapIntelligence = () => {
  const { cabinet } = useAuthContext();
  const { toast } = useToast();
  const [pins, setPins] = useState<MapPin[]>([]);
  const [regionals, setRegionals] = useState<MapRegional[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMapIntelligence = async () => {
    if (!cabinet?.cabinet_id) return;

    try {
      setLoading(true);
      const [pinsRes, regionalsRes] = await Promise.all([
        (supabase as any).from('map_pins').select('*').eq('cabinet_id', cabinet.cabinet_id),
        (supabase as any).from('map_regionals').select('*').eq('cabinet_id', cabinet.cabinet_id)
      ]);

      if (pinsRes.error) throw pinsRes.error;
      if (regionalsRes.error) throw regionalsRes.error;

      setPins(pinsRes.data || []);
      setRegionals(regionalsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching map intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  const addPin = async (lat: number, lng: number, comment: string) => {
    if (!cabinet?.cabinet_id) return;

    try {
      const { data, error } = await (supabase as any)
        .from('map_pins')
        .insert([{
          cabinet_id: cabinet.cabinet_id,
          lat,
          lng,
          comment
        }])
        .select()
        .single();

      if (error) throw error;
      setPins(prev => [...prev, data]);
      toast({ title: "Pino adicionado", description: "O comentário foi salvo com sucesso." });
      return data;
    } catch (err: any) {
      toast({ title: "Erro ao adicionar pino", description: err.message, variant: "destructive" });
    }
  };

  const deletePin = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('map_pins').delete().eq('id', id);
      if (error) throw error;
      setPins(prev => prev.filter(p => p.id !== id));
      toast({ title: "Pino removido" });
    } catch (err: any) {
      toast({ title: "Erro ao remover pino", description: err.message, variant: "destructive" });
    }
  };

  const addRegional = async (name: string, color: string, coordinates: [number, number][]) => {
    if (!cabinet?.cabinet_id) return;

    try {
      const { data, error } = await (supabase as any)
        .from('map_regionals')
        .insert([{
          cabinet_id: cabinet.cabinet_id,
          name,
          color,
          coordinates
        }])
        .select()
        .single();

      if (error) throw error;
      setRegionals(prev => [...prev, data]);
      toast({ title: "Regional criada", description: `A regional ${name} foi salva com sucesso.` });
      return data;
    } catch (err: any) {
      toast({ title: "Erro ao criar regional", description: err.message, variant: "destructive" });
    }
  };

  const deleteRegional = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('map_regionals').delete().eq('id', id);
      if (error) throw error;
      setRegionals(prev => prev.filter(r => r.id !== id));
      toast({ title: "Regional removida" });
    } catch (err: any) {
      toast({ title: "Erro ao remover regional", description: err.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchMapIntelligence();
  }, [cabinet?.cabinet_id]);

  return {
    pins,
    regionals,
    loading,
    addPin,
    deletePin,
    addRegional,
    deleteRegional,
    refresh: fetchMapIntelligence
  };
};
