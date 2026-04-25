import { SupabaseClient } from "@supabase/supabase-js";

export const getVoterCountFromFilters = async (
  supabase: SupabaseClient,
  cabinetId: string,
  filtros: any
): Promise<number> => {
  if (!cabinetId || !filtros) return 0;

  let query = supabase
    .from('eleitores')
    .select('id', { count: 'exact', head: true })
    .eq('gabinete_id', cabinetId);

  // Sexo
  if (filtros.sexo) {
    const normalizedSex = filtros.sexo === 'M' ? 'masculino' : 
                          filtros.sexo === 'F' ? 'feminino' : 
                          filtros.sexo;
    
    if (normalizedSex !== 'todos') {
      const queryValue = normalizedSex.toLowerCase();
      query = query.ilike('sex', queryValue);
    }
  }

  // Bairro
  if (filtros.neighborhood) {
    if (Array.isArray(filtros.neighborhood)) {
      if (filtros.neighborhood.length > 0) {
        query = query.in('neighborhood', filtros.neighborhood);
      }
    } else if (filtros.neighborhood !== 'todos') {
      query = query.eq('neighborhood', filtros.neighborhood);
    }
  }

  // Cidade
  if (filtros.city) {
    if (Array.isArray(filtros.city)) {
      if (filtros.city.length > 0) {
        query = query.in('cidade', filtros.city);
      }
    } else if (filtros.city !== 'todos') {
      query = query.eq('cidade', filtros.city);
    }
  }

  // Is Leader
  if (filtros.isLeader !== undefined) {
    query = query.eq('is_leader', filtros.isLeader);
  }

  // Profession
  if (filtros.profession) {
    if (Array.isArray(filtros.profession)) {
      if (filtros.profession.length > 0) {
        query = query.in('profession', filtros.profession);
      }
    } else if (filtros.profession !== 'todos') {
      query = query.eq('profession', filtros.profession);
    }
  }

  // Age
  if (filtros.minAge || filtros.maxAge) {
    const today = new Date();
    if (filtros.maxAge) {
      const minDate = new Date(today.getFullYear() - filtros.maxAge - 1, today.getMonth(), today.getDate());
      query = query.gte('birth_date', minDate.toISOString().split('T')[0]);
    }
    if (filtros.minAge) {
      const maxDate = new Date(today.getFullYear() - filtros.minAge, today.getMonth(), today.getDate());
      query = query.lte('birth_date', maxDate.toISOString().split('T')[0]);
    }
  }

  // Birthday Month and types
  if (filtros.birthdayMonth || filtros.birthdayType) {
    const { data: eleitores, error: birthError } = await supabase
      .from('eleitores')
      .select('id, birth_date')
      .eq('gabinete_id', cabinetId);

    if (!birthError && eleitores) {
      const filteredByBirthday = eleitores.filter(e => {
        if (!e.birth_date) return false;
        
        const birthDate = new Date(e.birth_date);
        const birthMonth = birthDate.getUTCMonth() + 1;
        const birthDay = birthDate.getUTCDate();
        
        const today = new Date();
        const currentMonth = today.getUTCMonth() + 1;
        const currentDay = today.getUTCDate();

        if (filtros.birthdayType === 'month' || (!filtros.birthdayType && filtros.birthdayMonth)) {
          return birthMonth === Number(filtros.birthdayMonth);
        }

        if (filtros.birthdayType === 'today') {
          return birthMonth === currentMonth && birthDay === currentDay;
        }

        if (filtros.birthdayType === 'current_month') {
          return birthMonth === currentMonth;
        }

        if (filtros.birthdayType === 'week') {
          const nextSevenDays = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setUTCDate(today.getUTCDate() + i);
            nextSevenDays.push({ month: d.getUTCMonth() + 1, day: d.getUTCDate() });
          }
          return nextSevenDays.some(d => d.month === birthMonth && d.day === birthDay);
        }

        if (filtros.birthdayType === 'next_x_days') {
          const days = Number(filtros.birthdayDays) || 0;
          const targetDate = new Date(today);
          targetDate.setUTCDate(today.getUTCDate() + days);
          return birthMonth === (targetDate.getUTCMonth() + 1) && birthDay === targetDate.getUTCDate();
        }

        return false;
      });

      const monthEleitorIds = filteredByBirthday.map(e => e.id);
      if (monthEleitorIds.length === 0) return 0;
      query = query.in('id', monthEleitorIds);
    }
  }

  // Demandas
  if (filtros.demandasTotal || filtros.demandasPeriod || filtros.demandasType || filtros.demandasFilterType) {
    const { data: allEleitoresIds } = await supabase
      .from('eleitores')
      .select('id')
      .eq('gabinete_id', cabinetId);
    
    const allEleitorIds = allEleitoresIds?.map(e => e.id) || [];

    let queryDemandas = supabase
      .from('demandas')
      .select('eleitor_id, status, created_at')
      .eq('gabinete_id', cabinetId)
      .not('eleitor_id', 'is', null);

    const dFilterType = filtros.demandasFilterType || 'total';

    if (dFilterType === 'total') {
      if (filtros.demandasType && filtros.demandasType !== 'todos') {
        queryDemandas = queryDemandas.eq('status', filtros.demandasType);
      }

      if (filtros.demandasPeriod && filtros.demandasPeriod !== 'todos') {
        const days = parseInt(filtros.demandasPeriod);
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        queryDemandas = queryDemandas.gte('created_at', dateLimit.toISOString());
      }

      const { data: demandsData, error: demError } = await queryDemandas;
      if (!demError && demandsData) {
        const counts: Record<string, number> = {};
        demandsData.forEach(d => {
          if (d.eleitor_id) counts[d.eleitor_id] = (counts[d.eleitor_id] || 0) + 1;
        });

        const minTotal = filtros.demandasTotal ? parseInt(filtros.demandasTotal) : 0;
        const validEleitorIds = Object.keys(counts).filter(id => counts[id] >= minTotal);
        if (validEleitorIds.length === 0) return 0;
        query = query.in('id', validEleitorIds);
      }
    } else if (dFilterType === 'atendida') {
      const { data: atendidas } = await queryDemandas.eq('status', 'resolvida');
      const ids = [...new Set(atendidas?.map(d => d.eleitor_id) || [])];
      if (ids.length === 0) return 0;
      query = query.in('id', ids);
    } else if (dFilterType === 'pendente_x_dias') {
      const days = Number(filtros.demandasDays) || 0;
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - days);
      const { data: pendentes } = await queryDemandas
        .eq('status', 'pendente')
        .lte('created_at', limitDate.toISOString());
      const ids = [...new Set(pendentes?.map(d => d.eleitor_id) || [])];
      if (ids.length === 0) return 0;
      query = query.in('id', ids);
    } else if (dFilterType === 'sem_registro_x_dias') {
      const days = Number(filtros.demandasDays) || 0;
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - days);
      const { data: recentes } = await queryDemandas.gte('created_at', limitDate.toISOString());
      const idsComDemandasRecentes = new Set(recentes?.map(d => d.eleitor_id) || []);
      const idsSemDemandasRecentes = allEleitorIds.filter(id => !idsComDemandasRecentes.has(id));
      if (idsSemDemandasRecentes.length === 0) return 0;
      query = query.in('id', idsSemDemandasRecentes);
    }
  }

  // Indicacoes
  if (filtros.indicacoesFilterType) {
    const { data: allEleitoresIds } = await supabase
      .from('eleitores')
      .select('id')
      .eq('gabinete_id', cabinetId);
    
    const allEleitorIds = allEleitoresIds?.map(e => e.id) || [];

    let queryIndicacoes = supabase
      .from('indicacoes')
      .select('eleitor_id, status, created_at')
      .eq('gabinete_id', cabinetId)
      .not('eleitor_id', 'is', null);

    const iFilterType = filtros.indicacoesFilterType;

    if (iFilterType === 'atendida') {
      const { data: atendidas } = await queryIndicacoes.eq('status', 'implementada');
      const ids = [...new Set(atendidas?.map(d => d.eleitor_id) || [])];
      if (ids.length === 0) return 0;
      query = query.in('id', ids);
    } else if (iFilterType === 'pendente_x_dias') {
      const days = Number(filtros.indicacoesDays) || 0;
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - days);
      const { data: pendentes } = await queryIndicacoes
        .eq('status', 'pendente')
        .lte('created_at', limitDate.toISOString());
      const ids = [...new Set(pendentes?.map(d => d.eleitor_id) || [])];
      if (ids.length === 0) return 0;
      query = query.in('id', ids);
    } else if (iFilterType === 'sem_registro_x_dias') {
      const days = Number(filtros.indicacoesDays) || 0;
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - days);
      const { data: recentes } = await queryIndicacoes.gte('created_at', limitDate.toISOString());
      const idsComIndicacoesRecentes = new Set(recentes?.map(d => d.eleitor_id) || []);
      const idsSemIndicacoesRecentes = allEleitorIds.filter(id => !idsComIndicacoesRecentes.has(id));
      if (idsSemIndicacoesRecentes.length === 0) return 0;
      query = query.in('id', idsSemIndicacoesRecentes);
    }
  }

  const { count, error: finalError } = await query;
  if (finalError) throw finalError;
  return count || 0;
};
