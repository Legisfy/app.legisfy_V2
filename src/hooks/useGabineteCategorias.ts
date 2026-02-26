import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveInstitution } from './useActiveInstitution';

export interface GabineteCategory {
    id: string;
    nome: string;
    parent_id: string | null;
    destinado_a: string[];
    cor: string;
    icone: string;
}

export const useGabineteCategorias = (destino?: 'demandas' | 'indicacoes' | 'projetos_lei') => {
    const { activeInstitution } = useActiveInstitution();
    const [categories, setCategories] = useState<GabineteCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeInstitution?.cabinet_id) {
            fetchCategories();
        }
    }, [activeInstitution?.cabinet_id, destino]);

    const fetchCategories = async () => {
        if (!activeInstitution?.cabinet_id) return;
        setLoading(true);
        try {
            let query = supabase
                .from('gabinete_categorias' as any)
                .select('*')
                .eq('gabinete_id', activeInstitution.cabinet_id)
                .order('nome');

            if (destino) {
                query = query.contains('destinado_a', [destino]);
            }

            const { data, error } = await query as any;

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching gabinete categories:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        categories,
        loading,
        refreshCategories: fetchCategories
    };
};
