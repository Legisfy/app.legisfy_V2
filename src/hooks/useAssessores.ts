import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { useActiveInstitution } from './useActiveInstitution';

interface Assessor {
  id: string;
  nome: string;
  email: string;  
  cargo: string;
  user_id: string;
  avatar: string;
  ranking: number;
  eleitoresCadastrados: number;
  ideiasAprovadas: number;
  demandas: number;
  indicacoes: number;
  pontuacaoTotal: number;
}

export const useAssessores = () => {
  const { user } = useAuthContext();
  const { activeInstitution } = useActiveInstitution();
  const [assessores, setAssessores] = useState<Assessor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('=== useAssessores useEffect triggered ===');
    console.log('User exists:', !!user);
    console.log('Active Institution:', activeInstitution);
    console.log('Cabinet ID:', activeInstitution?.cabinet_id);
    
    if (user && activeInstitution?.cabinet_id) {
      console.log('✅ Requirements met - calling fetchAssessores with cabinet_id:', activeInstitution.cabinet_id);
      fetchAssessores();
    } else {
      console.log('❌ Requirements not met:', { 
        hasUser: !!user, 
        hasCabinetId: !!activeInstitution?.cabinet_id,
        activeInstitution 
      });
      setAssessores([]);
      setLoading(false);
    }
  }, [user, activeInstitution?.cabinet_id]);

  const fetchAssessores = async () => {
    console.log('=== fetchAssessores started ===');
    console.log('Cabinet ID:', activeInstitution?.cabinet_id);
    
    if (!activeInstitution?.cabinet_id) {
      console.log('❌ No cabinet_id available, returning early');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Fetching data for cabinet_id:', activeInstitution.cabinet_id);
      
      // Buscar membros do gabinete
      const { data: members, error: membersError } = await (supabase as any)
        .rpc('get_gabinete_members_with_profiles', { gab_id: activeInstitution.cabinet_id });
      const rawMembers: any[] = (members as any[]) || [];

      console.log('📊 Members query result:', { 
        count: rawMembers.length, 
        members: rawMembers, 
        error: membersError 
      });

      // Montar mapa de perfis a partir da RPC
      let profilesMap: Record<string, { full_name?: string | null; avatar_url?: string | null }> = {};
      rawMembers.forEach((m: any) => {
        profilesMap[m.user_id] = { full_name: m.full_name, avatar_url: m.avatar_url };
      });

      // Buscar convites aceitos (opcional)
      const { data: acceptedInvites, error: invitesError } = await supabase
        .from('gabinete_invites')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .eq('status', 'accepted');

      console.log('📨 Invites query result:', { 
        count: acceptedInvites?.length || 0, 
        invites: acceptedInvites, 
        error: invitesError 
      });

      // Combinar dados de membros e convites aceitos
      let allAssessores: Assessor[] = [];

      // Processar membros existentes
      if (rawMembers.length > 0) {
        rawMembers.forEach((member: any) => {
          if (member.role !== 'politico') {
            const profile = profilesMap[member.user_id] || {};
            const assessor = {
              id: member.user_id,
              nome: (profile.full_name as string) || 'Assessor',
              email: '',
              cargo: member.role === 'assessor' ? 'Assessor' : 
                     member.role === 'chefe' ? 'Chefe de Gabinete' : 
                     member.role === 'assessor_parlamentar' ? 'Assessor Parlamentar' :
                     member.role === 'assessor_comunicacao' ? 'Assessor de Comunicação' :
                     member.role === 'assessor_tecnico' ? 'Assessor Técnico' : member.role,
              user_id: member.user_id,
              avatar: (profile.avatar_url as string) || '',
              ranking: 0,
              eleitoresCadastrados: 0,
              ideiasAprovadas: 0,
              demandas: 0,
              indicacoes: 0,
              pontuacaoTotal: 0
            };
            allAssessores.push(assessor);
          }
        });
      }

      // Processar convites aceitos que ainda não estão na lista de membros
      if (acceptedInvites && acceptedInvites.length > 0) {
        acceptedInvites.forEach((invite: any) => {
          // Verificar se o email já não está na lista de membros
          const existingMember = allAssessores.find(assessor => assessor.email === invite.email);
          if (!existingMember && invite.role !== 'politico') {
            // Extrair nome do email se não houver nome
            const emailName = invite.email.split('@')[0];
            const formattedName = emailName.split('.').map((part: string) => 
              part.charAt(0).toUpperCase() + part.slice(1)
            ).join(' ');

            const assessor = {
              id: `invite-${invite.email}`,
              nome: formattedName,
              email: invite.email,
              cargo: invite.role === 'assessor' ? 'Assessor' : 
                     invite.role === 'chefe' ? 'Chefe de Gabinete' : 
                     invite.role === 'assessor_parlamentar' ? 'Assessor Parlamentar' :
                     invite.role === 'assessor_comunicacao' ? 'Assessor de Comunicação' :
                     invite.role === 'assessor_tecnico' ? 'Assessor Técnico' : invite.role,
              user_id: `invite-${invite.email}`,
              avatar: '',
              ranking: 0,
              eleitoresCadastrados: 0,
              ideiasAprovadas: 0,
              demandas: 0,
              indicacoes: 0,
              pontuacaoTotal: 0
            };
            allAssessores.push(assessor);
          }
        });
      }

      console.log('✅ All assessores processed:', {
        count: allAssessores.length,
        assessores: allAssessores.map(a => ({ id: a.id, nome: a.nome, cargo: a.cargo }))
      });

      // Se não há assessores, retornar lista vazia
      if (allAssessores.length === 0) {
        console.log('❌ No assessores found - setting empty array');
        setAssessores([]);
        setLoading(false);
        return;
      }

      // Calcular estatísticas para cada assessor real (apenas para membros com user_id real)
      const assessoresWithStats = await Promise.all(
        allAssessores.map(async (assessor, index) => {
          // Só calcular estatísticas para usuários reais (não convites)
          if (assessor.user_id.startsWith('invite-')) {
            return {
              ...assessor,
              ranking: index + 1
            };
          }

          const [eleitoresRes, demandasRes, ideiasRes, indicacoesRes] = await Promise.all([
            supabase
              .from('eleitores')
              .select('id', { count: 'exact' })
              .eq('user_id', assessor.user_id)
              .eq('gabinete_id', activeInstitution.cabinet_id),
            supabase
              .from('demandas')
              .select('id', { count: 'exact' })
              .eq('user_id', assessor.user_id)
              .eq('gabinete_id', activeInstitution.cabinet_id),
            supabase
              .from('ideias')
              .select('id', { count: 'exact' })
              .eq('user_id', assessor.user_id)
              .eq('gabinete_id', activeInstitution.cabinet_id),
            supabase
              .from('indicacoes')
              .select('id', { count: 'exact' })
              .eq('user_id', assessor.user_id)
              .eq('gabinete_id', activeInstitution.cabinet_id)
          ]);

          return {
            ...assessor,
            eleitoresCadastrados: eleitoresRes.count || 0,
            ideiasAprovadas: ideiasRes.count || 0,
            demandas: demandasRes.count || 0,
            indicacoes: indicacoesRes.count || 0,
            ranking: index + 1,
            pontuacaoTotal: (eleitoresRes.count || 0) + (ideiasRes.count || 0) + (demandasRes.count || 0) + (indicacoesRes.count || 0)
          };
        })
      );

      // Ordenar por total de atividade para ranking
      assessoresWithStats.sort((a, b) => {
        const scoreA = a.pontuacaoTotal || (a.eleitoresCadastrados + a.ideiasAprovadas + a.demandas + (a.indicacoes || 0));
        const scoreB = b.pontuacaoTotal || (b.eleitoresCadastrados + b.ideiasAprovadas + b.demandas + (b.indicacoes || 0));
        return scoreB - scoreA;
      });

      // Atualizar rankings baseado na ordem
      assessoresWithStats.forEach((assessor, index) => {
        assessor.ranking = index + 1;
      });

      console.log('🎉 Final assessores with stats:', {
        count: assessoresWithStats.length,
        assessores: assessoresWithStats.map(a => ({ 
          nome: a.nome, 
          cargo: a.cargo, 
          ranking: a.ranking,
          stats: {
            eleitores: a.eleitoresCadastrados,
            ideias: a.ideiasAprovadas,
            demandas: a.demandas,
            indicacoes: a.indicacoes || 0
          }
        }))
      });
      setAssessores(assessoresWithStats);
    } catch (error) {
      console.error('❌ Error fetching assessores:', error);
      setAssessores([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    assessores,
    loading,
    refetch: fetchAssessores
  };
};