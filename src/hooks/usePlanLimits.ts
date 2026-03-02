import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveInstitution } from './useActiveInstitution';

export interface PlanLimits {
    max_users: number;
    max_eleitores: number;
    max_demandas: number;
    max_indicacoes: number;
    max_ideias: number;
    max_projetos_lei: number;
    monthly_price_cents: number;
    plan_name: string;
    plan_description: string;
    plan_id: string;
}

export interface ContractInfo {
    data_inicio: string | null;
    data_vencimento: string | null;
    recorrencia: string | null;
    is_trial: boolean;
    status: string | null;
    metadata?: any;
}

export interface PlanUsage {
    users: number;
    eleitores: number;
    demandas: number;
    indicacoes: number;
    ideias: number;
    projetos_lei: number;
}

export interface PlanLimitsResult {
    limits: PlanLimits | null;
    contract: ContractInfo | null;
    usage: PlanUsage;
    loading: boolean;
    usagePercent: (resource: keyof PlanUsage) => number;
    canCreate: (resource: keyof PlanUsage) => boolean;
    isNearLimit: (resource: keyof PlanUsage) => boolean;
    refetch: () => void;
}

const UNLIMITED = -1;

const RESOURCE_TO_LIMIT: Record<keyof PlanUsage, keyof PlanLimits> = {
    users: 'max_users',
    eleitores: 'max_eleitores',
    demandas: 'max_demandas',
    indicacoes: 'max_indicacoes',
    ideias: 'max_ideias',
    projetos_lei: 'max_projetos_lei',
};

export function usePlanLimits(): PlanLimitsResult {
    const { activeInstitution } = useActiveInstitution();
    const [limits, setLimits] = useState<PlanLimits | null>(null);
    const [contract, setContract] = useState<ContractInfo | null>(null);
    const [usage, setUsage] = useState<PlanUsage>({
        users: 0, eleitores: 0, demandas: 0, indicacoes: 0, ideias: 0, projetos_lei: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const cabinetId = activeInstitution?.cabinet_id;
        if (!cabinetId) { setLoading(false); return; }

        try {
            setLoading(true);
            const db = supabase as any;

            // 1. Buscar contrato ativo
            const { data: contractData } = await db
                .from('contracts')
                .select('plan_id, status, data_inicio, data_vencimento, recorrencia, is_trial, metadata')
                .eq('gabinete_id', cabinetId)
                .eq('status', 'ativo')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (contractData) {
                setContract({
                    data_inicio: contractData.data_inicio,
                    data_vencimento: contractData.data_vencimento,
                    recorrencia: contractData.recorrencia,
                    is_trial: contractData.is_trial ?? false,
                    status: contractData.status,
                    metadata: contractData.metadata,
                });

                // 2. Buscar detalhes do plano
                if (contractData.plan_id) {
                    const { data: plan } = await db
                        .from('plans')
                        .select('id, name, description, monthly_price_cents, max_users, max_eleitores, max_demandas, max_indicacoes, max_ideias, max_projetos_lei')
                        .eq('id', contractData.plan_id)
                        .single();

                    if (plan) {
                        setLimits({
                            plan_id: plan.id,
                            plan_name: plan.name,
                            plan_description: plan.description || '',
                            monthly_price_cents: plan.monthly_price_cents ?? 0,
                            max_users: plan.max_users ?? UNLIMITED,
                            max_eleitores: plan.max_eleitores ?? UNLIMITED,
                            max_demandas: plan.max_demandas ?? UNLIMITED,
                            max_indicacoes: plan.max_indicacoes ?? UNLIMITED,
                            max_ideias: plan.max_ideias ?? UNLIMITED,
                            max_projetos_lei: plan.max_projetos_lei ?? UNLIMITED,
                        });
                    }
                }
            }

            // 3. Contar uso atual em paralelo
            const [eleitoresRes, demandasRes, indicacoesRes, ideiasRes, projetosLeiRes, membersRes] = await Promise.all([
                supabase.from('eleitores').select('id', { count: 'exact', head: true }).eq('gabinete_id', cabinetId),
                supabase.from('demandas').select('id', { count: 'exact', head: true }).eq('gabinete_id', cabinetId),
                supabase.from('indicacoes').select('id', { count: 'exact', head: true }).eq('gabinete_id', cabinetId),
                supabase.from('ideias').select('id', { count: 'exact', head: true }).eq('gabinete_id', cabinetId),
                (supabase.from as any)('projetos_lei').select('id', { count: 'exact', head: true }).eq('gabinete_id', cabinetId),
                db.rpc('get_gabinete_members_with_profiles', { gab_id: cabinetId }),
            ]);

            setUsage({
                eleitores: eleitoresRes.count ?? 0,
                demandas: demandasRes.count ?? 0,
                indicacoes: indicacoesRes.count ?? 0,
                ideias: ideiasRes.count ?? 0,
                projetos_lei: projetosLeiRes.count ?? 0,
                users: Array.isArray(membersRes.data) ? membersRes.data.length : 0,
            });
        } catch (error) {
            console.error('[usePlanLimits] Error:', error);
        } finally {
            setLoading(false);
        }
    }, [activeInstitution?.cabinet_id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const usagePercent = useCallback((resource: keyof PlanUsage): number => {
        if (!limits) return 0;
        const max = limits[RESOURCE_TO_LIMIT[resource]] as number;
        if (max < 0) return -1;
        if (max === 0) return 100;
        return Math.min(100, Math.round((usage[resource] / max) * 100));
    }, [limits, usage]);

    const canCreate = useCallback((resource: keyof PlanUsage): boolean => {
        if (!limits) return true;
        const max = limits[RESOURCE_TO_LIMIT[resource]] as number;
        if (max < 0) return true;
        return usage[resource] < max;
    }, [limits, usage]);

    const isNearLimit = useCallback((resource: keyof PlanUsage): boolean => {
        const pct = usagePercent(resource);
        return pct !== -1 && pct >= 80;
    }, [usagePercent]);

    return { limits, contract, usage, loading, usagePercent, canCreate, isNearLimit, refetch: fetchData };
}
