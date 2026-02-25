import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveInstitution } from './useActiveInstitution';

interface GabineteStats {
  totalEleitores: number;
  totalIndicacoes: number;
  totalDemandas: number;
  totalIdeias: number;
  eleitoresGrowth: string;
  indicacoesGrowth: string;
  demandasGrowth: string;
  ideiasGrowth: string;
  userEleitores: number;
  userIndicacoes: number;
  userDemandas: number;
  userIdeias: number;
}

interface AssessorRanking {
  name: string;
  points: number;
  position: number;
  avatar_url?: string;
  role?: string;
  user_id?: string;
}

interface RecentActivity {
  type: string;
  description: string;
  time: string;
  user: string;
}

interface GabineteInfo {
  id: string;
  nome: string;
  logomarca_url?: string;
  politician_name?: string;
}

export function useGabineteData() {
  const [gabinete, setGabinete] = useState<GabineteInfo | null>(null);
  const [stats, setStats] = useState<GabineteStats>({
    totalEleitores: 0,
    totalIndicacoes: 0,
    totalDemandas: 0,
    totalIdeias: 0,
    eleitoresGrowth: '0%',
    indicacoesGrowth: '0%',
    demandasGrowth: '0%',
    ideiasGrowth: '0%',
    userEleitores: 0,
    userIndicacoes: 0,
    userDemandas: 0,
    userIdeias: 0,
  });
  const [assessorRanking, setAssessorRanking] = useState<AssessorRanking[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { activeInstitution } = useActiveInstitution();

  useEffect(() => {
    console.log('🚀 useGabineteData - useEffect triggered');
    console.log('🏛️ activeInstitution:', activeInstitution);

    if (activeInstitution?.cabinet_id) {
      console.log('📋 Loading data for cabinet ID:', activeInstitution.cabinet_id);
      loadGabineteDataForCabinet(activeInstitution.cabinet_id);

      // Subscribe to real-time updates for gabinete
      const subscription = supabase
        .channel(`gabinete-${activeInstitution.cabinet_id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'gabinetes',
            filter: `id=eq.${activeInstitution.cabinet_id}`
          },
          (payload) => {
            console.log('🔔 Gabinete updated in real-time:', payload.new);
            const updatedGabinete = payload.new as GabineteInfo;
            setGabinete(prev => ({
              ...prev,
              ...updatedGabinete
            }));
          }
        )
        .subscribe();

      // Listen for logo update events
      const handleLogoUpdate = (event: CustomEvent) => {
        console.log('📸 Logo update event received:', event.detail);
        const newLogoUrl = event.detail?.logoUrl;
        if (newLogoUrl) {
          // Add cache-buster to force browser to reload the image
          const cacheBuster = `?t=${Date.now()}`;
          const urlWithCacheBuster = newLogoUrl.includes('?')
            ? `${newLogoUrl}&cb=${Date.now()}`
            : `${newLogoUrl}${cacheBuster}`;
          setGabinete(prev => prev ? { ...prev, logomarca_url: urlWithCacheBuster } : prev);
        } else {
          loadGabineteDataForCabinet(activeInstitution.cabinet_id);
        }
      };

      window.addEventListener('gabinete-logo-updated', handleLogoUpdate as EventListener);

      return () => {
        subscription.unsubscribe();
        window.removeEventListener('gabinete-logo-updated', handleLogoUpdate as EventListener);
      };
    } else {
      console.log('👤 Loading general gabinete data');
      loadGabineteData();
    }
  }, [activeInstitution]);

  const loadGabineteDataForCabinet = async (cabinetId: string) => {
    try {
      setLoading(true);
      console.log('useGabineteData - Loading gabinete data for cabinet ID:', cabinetId);

      // Buscar dados do gabinete diretamente pelo ID
      const { data: gabineteData } = await supabase
        .from('gabinetes')
        .select('id, nome, logomarca_url, politician_name')
        .eq('id', cabinetId)
        .single(); // Use single() to ensure we get the cabinet

      console.log('🏢 Gabinete data fetched:', gabineteData);

      if (gabineteData) {
        const gabineteInfo = gabineteData as GabineteInfo;
        setGabinete(gabineteInfo);
        console.log('✅ Gabinete data loaded successfully:', gabineteInfo);

        // Load stats in parallel
        await Promise.all([
          loadStats(gabineteInfo.id),
          loadAssessorRanking(gabineteInfo.id),
          loadRecentActivities(gabineteInfo.id),
        ]);
      } else {
        console.error('❌ No gabinete data found for cabinet ID:', cabinetId);
        setError('Gabinete não encontrado');
      }
    } catch (error) {
      console.error('Error loading gabinete data for cabinet:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGabineteData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, check if user is a politician with their own gabinete
      const { data: gabineteData } = await supabase
        .from('gabinetes')
        .select('id, nome, logomarca_url, politician_name')
        .eq('politico_id', user.id)
        .eq('status', 'ativo')
        .maybeSingle();

      if (gabineteData) {
        const gabineteInfo = gabineteData as GabineteInfo;
        setGabinete(gabineteInfo);

        // Load stats in parallel
        await Promise.all([
          loadStats(gabineteInfo.id),
          loadAssessorRanking(gabineteInfo.id),
          loadRecentActivities(gabineteInfo.id),
        ]);
      } else {
        // If not a politician, try to find gabinete through gabinete_members
        const { data: memberData } = await supabase
          .from('gabinete_members')
          .select(`
            gabinete_id,
            gabinetes!inner (
              id,
              nome,
              logomarca_url,
              politician_name
            )
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberData?.gabinetes) {
          const gabineteData = Array.isArray(memberData.gabinetes)
            ? memberData.gabinetes[0]
            : memberData.gabinetes;
          const gabineteInfo = gabineteData as GabineteInfo;
          setGabinete(gabineteInfo);

          // Load stats in parallel
          await Promise.all([
            loadStats(gabineteInfo.id),
            loadAssessorRanking(gabineteInfo.id),
            loadRecentActivities(gabineteInfo.id),
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading gabinete data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (gabineteId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const previousMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}-01`;

      // Get current totals (gabinete)
      const [eleitores, indicacoes, demandas, ideias] = await Promise.all([
        supabase.from('eleitores').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId),
        supabase.from('indicacoes').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId),
        supabase.from('demandas').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId),
        supabase.from('ideias').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId),
      ]);

      // Get current user-specific totals
      const [userEleitores, userIndicacoes, userDemandas, userIdeias] = await Promise.all([
        supabase.from('eleitores').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).eq('user_id', user.id),
        supabase.from('indicacoes').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).eq('user_id', user.id),
        supabase.from('demandas').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).eq('user_id', user.id),
        supabase.from('ideias').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).eq('user_id', user.id),
      ]);

      // Get previous month counts for growth calculation
      const [eleitoresPrev, indicacoesPrev, demandasPrev, ideiasPrev] = await Promise.all([
        supabase.from('eleitores').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).lt('created_at', currentMonth),
        supabase.from('indicacoes').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).lt('created_at', currentMonth),
        supabase.from('demandas').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).lt('created_at', currentMonth),
        supabase.from('ideias').select('id', { count: 'exact' }).eq('gabinete_id', gabineteId).lt('created_at', currentMonth),
      ]);

      // Calculate growth percentages
      const calculateGrowth = (current: number, previous: number): string => {
        if (previous === 0) return current > 0 ? '+100%' : '0%';
        const growth = ((current - previous) / previous) * 100;
        return growth > 0 ? `+${Math.round(growth)}%` : `${Math.round(growth)}%`;
      };

      setStats({
        totalEleitores: eleitores.count || 0,
        totalIndicacoes: indicacoes.count || 0,
        totalDemandas: demandas.count || 0,
        totalIdeias: ideias.count || 0,
        eleitoresGrowth: calculateGrowth(eleitores.count || 0, eleitoresPrev.count || 0),
        indicacoesGrowth: calculateGrowth(indicacoes.count || 0, indicacoesPrev.count || 0),
        demandasGrowth: calculateGrowth(demandas.count || 0, demandasPrev.count || 0),
        ideiasGrowth: calculateGrowth(ideias.count || 0, ideiasPrev.count || 0),
        userEleitores: userEleitores.count || 0,
        userIndicacoes: userIndicacoes.count || 0,
        userDemandas: userDemandas.count || 0,
        userIdeias: userIdeias.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAssessorRanking = async (gabineteId: string) => {
    try {
      console.log('🏆 Loading assessor ranking for gabinete:', gabineteId);

      // Debug: Check if gabinete exists
      const { data: gabineteCheck } = await supabase
        .from('gabinetes')
        .select('id, nome, politico_id')
        .eq('id', gabineteId)
        .single();

      console.log('🏢 Gabinete check:', gabineteCheck);

      // First try to use the same RPC function that works in useAssessores
      const { data: members, error: membersError } = await (supabase as any)
        .rpc('get_gabinete_members_with_profiles', { gab_id: gabineteId });

      console.log('👥 Members RPC result (raw):', { members, error: membersError, count: members?.length || 0 });
      console.log('👥 Members detailed:', JSON.stringify(members, null, 2));

      // Also check for assessores in the assessores table as fallback
      const { data: assessoresRows } = await supabase
        .from('assessores')
        .select('user_id, nome, status')
        .eq('gabinete_id', gabineteId)
        .eq('status', 'ativo');

      console.log('🧑‍💼 Assessores table result:', assessoresRows);

      // Buscar político do gabinete (que pode não estar em gabinete_members)
      const { data: gabinete, error: gabineteError } = await supabase
        .from('gabinetes')
        .select('politico_id')
        .eq('id', gabineteId)
        .single();

      console.log('🏛️ Gabinete politico query result:', { gabinete, error: gabineteError });

      let politicoProfile = null;
      if (gabinete && gabinete.politico_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', gabinete.politico_id)
          .single();

        politicoProfile = profile;
      }

      // Convert RPC result to expected format and merge with assessores table
      const allMembers: any[] = [];

      // Process RPC results (these come from get_gabinete_members_with_profiles)
      if (members && Array.isArray(members)) {
        console.log('📋 Processing RPC members:', members.length);
        members.forEach((m: any) => {
          console.log('👤 Processing member:', m);
          if (m.role !== 'politico') {
            allMembers.push({
              user_id: m.user_id,
              role: m.role,
              profiles: {
                full_name: m.full_name,
                avatar_url: m.avatar_url
              }
            });
          }
        });
      }

      console.log('📊 Members after RPC processing:', allMembers);

      // Add assessores from assessores table if not already included
      const existingIds = new Set(allMembers.map((m: any) => m.user_id).filter(id => !!id));
      (assessoresRows || []).forEach((a: any) => {
        if (!a.user_id || !existingIds.has(a.user_id)) {
          console.log('➕ Adding assessor from table:', a);
          allMembers.push({
            user_id: a.user_id || `ghost-${a.id || Math.random()}`,
            role: a.cargo || 'Assessor',
            profiles: { full_name: a.nome, avatar_url: null }
          });
          if (a.user_id) existingIds.add(a.user_id);
        }
      });

      // Use allMembers directly as assessorMembers (politicians already filtered)
      const assessorMembers = allMembers;

      console.log('📊 Final assessor members for ranking:', assessorMembers);
      console.log('📊 Assessor members count:', assessorMembers.length);

      if (assessorMembers.length === 0) {
        console.log('❌ No members or politician found - trying to add current user as fallback');

        // Fallback: Add current user to ranking if they belong to the gabinete
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id !== gabinete?.politico_id) {
          const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', user.id)
            .single();

          if (currentUserProfile) {
            assessorMembers.push({
              user_id: user.id,
              role: 'assessor',
              profiles: currentUserProfile as any
            });
            console.log('✅ Added current user as fallback to assessor ranking');
          }
        }

        if (assessorMembers.length === 0) {
          setAssessorRanking([]);
          return;
        }
      }

      // Buscar sistema de pontuação configurado para o gabinete
      const { data: pontuacoes } = await supabase
        .from('gabinete_pontuacoes')
        .select('acao, pontos')
        .eq('gabinete_id', gabineteId);

      console.log('⚖️ Sistema de pontuação do gabinete:', pontuacoes);

      // Calcular pontos reais para cada assessor baseado em suas atividades
      const assessoresComPontos = await Promise.all(
        assessorMembers.map(async (assessor: any) => {
          const userId = assessor.user_id;

          // Buscar pontuações do assessor neste gabinete baseado nas ações realizadas
          const [eleitoresCount, demandasCriadasCount, demandasResolvidasCount, indicacoesCount, ideiasCount] = await Promise.all([
            // Contar eleitores cadastrados pelo assessor
            supabase
              .from('eleitores')
              .select('id', { count: 'exact' })
              .eq('gabinete_id', gabineteId)
              .eq('user_id', userId),

            // Contar demandas criadas pelo assessor (qualquer status)
            supabase
              .from('demandas')
              .select('id', { count: 'exact' })
              .eq('gabinete_id', gabineteId)
              .eq('user_id', userId),

            // Contar demandas resolvidas pelo assessor
            supabase
              .from('demandas')
              .select('id', { count: 'exact' })
              .eq('gabinete_id', gabineteId)
              .eq('user_id', userId)
              .eq('status', 'resolvida'),

            // Contar indicações criadas pelo assessor
            supabase
              .from('indicacoes')
              .select('id', { count: 'exact' })
              .eq('gabinete_id', gabineteId)
              .eq('user_id', userId),

            // Contar ideias criadas pelo assessor
            supabase
              .from('ideias')
              .select('id', { count: 'exact' })
              .eq('gabinete_id', gabineteId)
              .eq('user_id', userId),
          ]);

          // Calcular pontos totais baseado no sistema de pontuação
          let totalPoints = 0;

          if (pontuacoes && pontuacoes.length > 0) {
            // Usar sistema de pontuação personalizado do gabinete
            pontuacoes.forEach(pontuacao => {
              switch (pontuacao.acao) {
                case 'Eleitor cadastrado':
                  totalPoints += (eleitoresCount.count || 0) * pontuacao.pontos;
                  break;
                case 'Demanda criada':
                  totalPoints += (demandasCriadasCount.count || 0) * pontuacao.pontos;
                  break;
                case 'Demanda atendida':
                case 'Demanda resolvida':
                  totalPoints += (demandasResolvidasCount.count || 0) * pontuacao.pontos;
                  break;
                case 'Indicação criada':
                  totalPoints += (indicacoesCount.count || 0) * pontuacao.pontos;
                  break;
                case 'Ideia de projeto de lei':
                  totalPoints += (ideiasCount.count || 0) * pontuacao.pontos;
                  break;
              }
            });
          } else {
            // Sistema de pontuação padrão se não houver configuração
            totalPoints =
              (eleitoresCount.count || 0) * 1 + // 1 ponto por eleitor
              (demandasResolvidasCount.count || 0) * 3 + // 3 pontos por demanda resolvida
              (indicacoesCount.count || 0) * 1 + // 1 ponto por indicação
              (ideiasCount.count || 0) * 2; // 2 pontos por ideia
          }

          console.log(`👤 ${assessor.profiles?.full_name}: eleitores=${eleitoresCount.count}, demandasCriadas=${demandasCriadasCount.count}, demandasResolvidas=${demandasResolvidasCount.count}, indicacoes=${indicacoesCount.count}, ideias=${ideiasCount.count}, totalPoints=${totalPoints}`);

          // Ghost assessors (sem user_id ligado) mostram 0 pontos reais
          const finalPoints = totalPoints;

          return {
            name: assessor.profiles?.full_name || 'Usuário',
            avatar_url: assessor.profiles?.avatar_url,
            points: finalPoints,
            user_id: userId,
            role: assessor.role
          };
        })
      );

      // Ordenar por pontos (decrescente) e adicionar posições
      const ranking = assessoresComPontos
        .sort((a, b) => b.points - a.points)
        .map((assessor, index) => ({
          ...assessor,
          position: index + 1
        }));

      console.log('🎖️ Ranking calculated and sorted by points:', ranking);

      // If still no ranking (no activity), show assessors with 0 points
      if (ranking.length === 0 && assessorMembers.length > 0) {
        const fallbackRanking = assessorMembers.map((member: any, index: number) => ({
          name: member.profiles?.full_name || 'Usuário',
          avatar_url: member.profiles?.avatar_url,
          points: 0,
          position: index + 1,
          user_id: member.user_id,
          role: member.role
        }));

        console.log('📝 Using fallback ranking with 0 points:', fallbackRanking);
        setAssessorRanking(fallbackRanking);
      } else {
        setAssessorRanking(ranking);
      }

    } catch (error) {
      console.error('❌ Error loading assessor ranking:', error);
      setAssessorRanking([]);
    }
  };

  const loadRecentActivities = async (gabineteId: string) => {
    try {
      const activities: RecentActivity[] = [];

      // Get recent eleitores
      const { data: recentEleitores } = await supabase
        .from('eleitores')
        .select('name, created_at, user_id')
        .eq('gabinete_id', gabineteId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recent indicacoes
      const { data: recentIndicacoes } = await supabase
        .from('indicacoes')
        .select('titulo, created_at, user_id')
        .eq('gabinete_id', gabineteId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recent demandas (any status)
      const { data: recentDemandas } = await supabase
        .from('demandas')
        .select('description, created_at, user_id')
        .eq('gabinete_id', gabineteId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recent ideias
      const { data: recentIdeias } = await supabase
        .from('ideias')
        .select('titulo, created_at, user_id')
        .eq('gabinete_id', gabineteId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Get user names for all user_ids found
      const allUserIds = new Set<string>();
      recentEleitores?.forEach(item => allUserIds.add(item.user_id));
      recentIndicacoes?.forEach(item => allUserIds.add(item.user_id));
      recentDemandas?.forEach(item => allUserIds.add(item.user_id));
      recentIdeias?.forEach(item => allUserIds.add(item.user_id));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', Array.from(allUserIds));

      const userNamesMap = new Map();
      profiles?.forEach(profile => {
        userNamesMap.set(profile.user_id, profile.full_name || 'Usuário');
      });

      // Add eleitor activities
      recentEleitores?.forEach((eleitor: any) => {
        activities.push({
          type: 'eleitor',
          description: `Novo eleitor cadastrado: ${eleitor.name}`,
          time: formatRelativeTime(eleitor.created_at),
          user: userNamesMap.get(eleitor.user_id) || 'Usuário',
        });
      });

      // Add indicacao activities
      recentIndicacoes?.forEach((indicacao: any) => {
        activities.push({
          type: 'indicacao',
          description: `Nova indicação criada: ${indicacao.titulo}`,
          time: formatRelativeTime(indicacao.created_at),
          user: userNamesMap.get(indicacao.user_id) || 'Usuário',
        });
      });

      // Add demanda activities
      recentDemandas?.forEach((demanda: any) => {
        activities.push({
          type: 'demanda',
          description: `Nova demanda criada: ${demanda.title}`,
          time: formatRelativeTime(demanda.created_at),
          user: userNamesMap.get(demanda.user_id) || 'Usuário',
        });
      });

      // Add ideia activities
      recentIdeias?.forEach((ideia: any) => {
        activities.push({
          type: 'ideia',
          description: `Nova ideia criada: ${ideia.titulo}`,
          time: formatRelativeTime(ideia.created_at),
          user: userNamesMap.get(ideia.user_id) || 'Usuário',
        });
      });

      // Sort by timestamp (most recent first)
      activities.sort((a, b) => {
        const timeA = parseRelativeTime(a.time);
        const timeB = parseRelativeTime(b.time);
        return timeA - timeB;
      });

      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent activities:', error);
      setRecentActivities([]);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `há ${diffInMinutes} minutos`;
    } else if (diffInHours < 24) {
      return `há ${diffInHours} horas`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `há ${diffInDays} dias`;
    }
  };

  const parseRelativeTime = (timeString: string): number => {
    const match = timeString.match(/há (\d+) (minutos|horas|dias)/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'minutos':
        return value;
      case 'horas':
        return value * 60;
      case 'dias':
        return value * 60 * 24;
      default:
        return 0;
    }
  };

  return {
    gabinete,
    stats,
    assessorRanking,
    recentActivities,
    loading,
    error,
    refetch: activeInstitution?.cabinet_id ? () => loadGabineteDataForCabinet(activeInstitution.cabinet_id) : loadGabineteData,
  };
}
