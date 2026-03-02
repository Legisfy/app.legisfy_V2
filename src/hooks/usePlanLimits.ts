import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveInstitution } from './useActiveInstitution';

export interface PlanLimits {
    max_users: number;
    max_eleitores: number;
    max_demandas: number;
    max_indicacoes: number;
    max_ideias: number;
    monthly_price_cents: number;
    plan_name: string;
    plan_description: string;
}

export interface PlanUsage {
    users: number;
    eleitores: number;
    demandas: number;
    indicacoes: number;
    ideias: number;
}

export interface PlanLimitsResult {
    limits: PlanLimits | null;
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
};

export function usePlanLimits(): PlanLimitsResult {
    const { activeInstitution } = useActiveInstitution();
    const [limits, setLimits] = useState<PlanLimits | null>(null);
    const [usage, setUsage] = useState<PlanUsage>({
        users: 0, eleitores: 0, demandas: 0, indicacoes: 0, ideias: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const cabinetId = activeInstitution?.cabinet_id;
        if (!cabinetId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // 1. Buscar contrato ativo do gabinete via cast para evitar erros de tipo gerado
            const db = supabase as any;
            const { data: contract } = await db
                .from('contracts')
                .select('plan_id, status')
                .eq('gabinete_id', cabinetId)
                .eq('status', 'ativo')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (contract?.plan_id) {
                // 2. Buscar detalhes do plano
                const { data: plan } = await db
                    .from('plans')
                    .select('name, description, monthly_price_cents, max_users, max_eleitores, max_demandas, max_indicacoes, max_ideias')
                    .eq('id', contract.plan_id)
                    .single();

                if (plan) {
                    setLimits({
                        plan_name: plan.name,
                        plan_description: plan.description || '',
                        monthly_price_cents: plan.monthly_price_cents ?? 0,
                        max_users: plan.max_users ?? UNLIMITED,
                        max_eleitores: plan.max_eleitores ?? UNLIMITED,
                        max_demandas: plan.max_demandas ?? UNLIMITED,
                        max_indicacoes: plan.max_indicacoes ?? UNLIMITED,
                        max_ideias: plan.max_ideias ?? UNLIMITED,
                    });
                }
            }

            // 3. Contar uso atual em paralelo
            const [eleitoresRes, demandasRes, indicacoesRes, ideiasRes, membersRes] = await Promise.all([
                supabase.from('eleitores').select('id', { count: 'exact', head: true }).eq('gabinete_id', cabinetId),
                supabase.from('demandas').select('id', { count: 'exact', head: true }).eq('gabinete_id', cabinetId),
                supabase.from('indicacoes').select('id', { count: 'exact', head: true }).eq('gabinete_id', cabinetId),
                supabase.from('ideias').select('id', { count: 'exact', head: true }).eq('gabinete_id', cabinetId),
                db.rpc('get_gabinete_members_with_profiles', { gab_id: cabinetId }),
            ]);

            const membersCount = Array.isArray(membersRes.data) ? membersRes.data.length : 0;

            setUsage({
                eleitores: eleitoresRes.count ?? 0,
                demandas: demandasRes.count ?? 0,
                indicacoes: indicacoesRes.count ?? 0,
                ideias: ideiasRes.count ?? 0,
                users: membersCount,
            });
        } catch (error) {
            console.error('[usePlanLimits] Error:', error);
        } finally {
            setLoading(false);
        }
    }, [activeInstitution?.cabinet_id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const usagePercent = useCallback((resource: keyof PlanUsage): number => {
        if (!limits) return 0;
        const limitKey = RESOURCE_TO_LIMIT[resource];
        const max = limits[limitKey] as number;
        if (max === UNLIMITED || max < 0) return -1;
        if (max === 0) return 100;
        return Math.min(100, Math.round((usage[resource] / max) * 100));
    }, [limits, usage]);

    const canCreate = useCallback((resource: keyof PlanUsage): boolean => {
        if (!limits) return true;
        const limitKey = RESOURCE_TO_LIMIT[resource];
        const max = limits[limitKey] as number;
        if (max < 0) return true; // ilimitado
        return usage[resource] < max;
    }, [limits, usage]);

    const isNearLimit = useCallback((resource: keyof PlanUsage): boolean => {
        const pct = usagePercent(resource);
        return pct !== -1 && pct >= 80;
    }, [usagePercent]);

    return { limits, usage, loading, usagePercent, canCreate, isNearLimit, refetch: fetchData };
}
