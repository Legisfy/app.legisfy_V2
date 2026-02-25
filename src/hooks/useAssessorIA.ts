import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';

interface AssessorIA {
    id: string;
    nome: string;
    comportamento: string;
    mensagem_boas_vindas: string;
    numero_whatsapp: string;
    gabinete_id: string;
    status: string;
    created_by: string;
}

export function useAssessorIA() {
    const { cabinet } = useAuthContext();
    const [assessor, setAssessor] = useState<AssessorIA | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssessor = async () => {
            if (!cabinet?.cabinet_id) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('meu_assessor_ia')
                    .select('*')
                    .eq('gabinete_id', cabinet.cabinet_id)
                    .maybeSingle();

                if (error) {
                    console.error('Erro ao carregar assessor IA:', error);
                    return;
                }

                setAssessor(data as AssessorIA | null);
            } catch (err) {
                console.error('Erro ao buscar assessor IA:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAssessor();
    }, [cabinet?.cabinet_id]);

    return {
        assessor,
        loading,
        nome: assessor?.nome || 'Assessor IA',
        comportamento: assessor?.comportamento || '',
        isConfigured: !!assessor,
    };
}
