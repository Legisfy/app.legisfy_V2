import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || OPENAI_API_KEY;

interface ActionRequest {
  action?: string
  parameters?: any
  userId: string
  userName?: string
  gabineteId: string
  userRole: string
  userText?: string
  audioBase64?: string
}

// Função para cadastrar eleitor
async function cadastrarEleitor(params: any, gabineteId: string): Promise<{ success: boolean, message: string, data?: any }> {
  try {
    const { nome, telefone, endereco, tags } = params

    if (!nome) {
      return { success: false, message: 'Nome é obrigatório para cadastrar eleitor.' }
    }

    const { data, error } = await supabase
      .from('eleitores_whatsapp')
      .insert({
        gabinete_id: gabineteId,
        nome: nome.trim(),
        telefone: telefone?.trim() || null,
        endereco: endereco?.trim() || null,
        tags: (typeof tags === 'string') ? JSON.parse(tags) : (tags || [])
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao cadastrar eleitor:', error)
      return { success: false, message: 'Erro ao cadastrar eleitor. Tente novamente.' }
    }

    return {
      success: true,
      message: `✅ Eleitor ${nome} cadastrado com sucesso!`,
      data
    }
  } catch (error) {
    console.error('Erro no cadastro de eleitor:', error)
    return { success: false, message: 'Erro interno ao cadastrar eleitor.' }
  }
}

// Função para criar indicação
async function criarIndicacao(params: any, gabineteId: string): Promise<{ success: boolean, message: string, data?: any }> {
  try {
    const { titulo, descricao } = params

    if (!titulo) {
      return { success: false, message: 'Título é obrigatório para criar indicação.' }
    }

    const { data, error } = await supabase
      .from('indicacoes_whatsapp')
      .insert({
        gabinete_id: gabineteId,
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        status: 'CRIADA'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar indicação:', error)
      return { success: false, message: 'Erro ao criar indicação. Tente novamente.' }
    }

    return {
      success: true,
      message: `📋 Indicação "${titulo}" criada com sucesso!\n\nStatus: CRIADA\nID: ${data.id.substring(0, 8)}`,
      data
    }
  } catch (error) {
    console.error('Erro na criação de indicação:', error)
    return { success: false, message: 'Erro interno ao criar indicação.' }
  }
}

// Função para registrar demanda
async function registrarDemanda(params: any, gabineteId: string): Promise<{ success: boolean, message: string, data?: any }> {
  try {
    const { titulo, descricao, anexos } = params

    if (!titulo) {
      return { success: false, message: 'Título é obrigatório para registrar demanda.' }
    }

    const { data, error } = await supabase
      .from('demandas_whatsapp')
      .insert({
        gabinete_id: gabineteId,
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        status: 'ABERTA',
        anexos: (typeof anexos === 'string') ? JSON.parse(anexos) : (anexos || [])
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao registrar demanda:', error)
      return { success: false, message: 'Erro ao registrar demanda. Tente novamente.' }
    }

    return {
      success: true,
      message: `🎯 Demanda "${titulo}" registrada com sucesso!\n\nStatus: ABERTA\nID: ${data.id.substring(0, 8)}`,
      data
    }
  } catch (error) {
    console.error('Erro no registro de demanda:', error)
    return { success: false, message: 'Erro interno ao registrar demanda.' }
  }
}

// Função para cadastrar ideia
async function cadastrarIdeia(params: any, gabineteId: string): Promise<{ success: boolean, message: string, data?: any }> {
  try {
    const { titulo, descricao, anexos } = params

    if (!titulo) {
      return { success: false, message: 'Título é obrigatório para cadastrar ideia.' }
    }

    const { data, error } = await supabase
      .from('ideias_whatsapp')
      .insert({
        gabinete_id: gabineteId,
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        origem: 'whatsapp',
        anexos: (typeof anexos === 'string') ? JSON.parse(anexos) : (anexos || [])
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao cadastrar ideia:', error)
      return { success: false, message: 'Erro ao cadastrar ideia. Tente novamente.' }
    }

    return {
      success: true,
      message: `💡 Ideia "${titulo}" cadastrada com sucesso!\n\nID: ${data.id.substring(0, 8)}`,
      data
    }
  } catch (error) {
    console.error('Erro no cadastro de ideia:', error)
    return { success: false, message: 'Erro interno ao cadastrar ideia.' }
  }
}

// Função para consultar e-mails (Gmail)
async function consultarEmails(gabineteId: string): Promise<{ success: boolean, message: string }> {
  try {
    const { data: config } = await supabase
      .from('ia_integrations')
      .select('google_access_token, google_enabled')
      .eq('gabinete_id', gabineteId)
      .maybeSingle()

    if (!config?.google_enabled || !config?.google_access_token) {
      return { success: false, message: 'Google não está conectado ou habilitado.' }
    }

    // Chamada simulada para API do Gmail
    return {
      success: true,
      message: `📧 *E-mails recentes do Gabinete:*\n\n1. Convite: Sessão Plenária Especial - 14:00h\n2. Ofício 123/2024 - Sec. de Obras\n3. Feedback de Munícipe: Bairro Centro\n\n_Você pode me pedir para resumir qualquer um deles!_`
    }
  } catch (error) {
    return { success: false, message: 'Erro ao acessar Gmail.' }
  }
}

// Função para consultar agenda (Google Calendar)
async function consultarAgenda(gabineteId: string): Promise<{ success: boolean, message: string }> {
  try {
    const { data: config } = await supabase
      .from('ia_integrations')
      .select('google_access_token, google_enabled')
      .eq('gabinete_id', gabineteId)
      .maybeSingle()

    if (!config?.google_enabled || !config?.google_access_token) {
      return { success: false, message: 'Google Agenda não está conectado.' }
    }

    return {
      success: true,
      message: `📅 *Agenda de Hoje (23/02):*\n\n• 09:00 - Reunião com Lideranças Comunitárias\n• 11:30 - Almoço de Bancada\n• 15:00 - Votação de Projetos de Lei\n\n_Deseja que eu agende algo novo?_`
    }
  } catch (error) {
    return { success: false, message: 'Erro ao acessar Agenda.' }
  }
}


// Nova Função: Cadastrar Agenda (Eventos)
async function cadastrarAgenda(params: any, gabineteId: string, userId: string): Promise<{ success: boolean, message: string, data?: any }> {
  try {
    const { titulo, descricao, data_inicio, data_fim, local } = params

    if (!titulo || !data_inicio || !data_fim) {
      return { success: false, message: 'Faltam dados principais: Título, Data/Hora Início e Fim são obrigatórios para agendar.' }
    }

    const isValidUUID = (str: string) => /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi.test(str);
    if (!isValidUUID(userId)) {
        return { success: false, message: '❌ Apenas membros oficiais do Gabinete podem criar agendas do mandato através do WhatsApp.' }
    }

    const { data, error } = await supabase
      .from('eventos')
      .insert({
        gabinete_id: gabineteId,
        user_id: userId,
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        data_inicio: data_inicio,
        data_fim: data_fim,
        local: local?.trim() || null,
        tipo: 'Reunião',
        cor: 'bg-blue-500' // Cor padrão UI
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao cadastrar evento agenda:', error)
      return { success: false, message: 'Erro SQL ao registrar agenda.' }
    }

    const fInicio = new Date(data_inicio).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const fFim = new Date(data_fim).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    return {
      success: true,
      message: `📅 *Compromisso Agendado!*\n\n🚩 *${titulo}*\n🕒 ${fInicio} - ${fFim}\n📍 ${local || 'A definir'}\n\n_Já disponível no calendário central do painel._`,
      data
    }
  } catch (error) {
    console.error('Erro JS cadastro agenda:', error)
    return { success: false, message: 'Erro interno ao processar a data do agendamento.' }
  }
}

// Nova Função: Atualizar Agenda
async function atualizarAgenda(params: any, gabineteId: string, userId: string): Promise<{ success: boolean, message: string }> {
  try {
    const { evento_id, titulo, descricao, data_inicio, data_fim, local } = params

    if (!evento_id) {
      return { success: false, message: 'Você precisa me informar o ID do evento para poder atualizar. Peça para buscar suas agendas primeiro se não souber o ID.' }
    }

    const isValidUUID = (str: string) => /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi.test(str);
    if (!isValidUUID(userId)) {
        return { success: false, message: '❌ Apenas membros oficiais do Gabinete podem editar agendas.' }
    }

    const updates: any = {}
    if (titulo) updates.titulo = titulo.trim()
    if (descricao !== undefined) updates.descricao = descricao ? descricao.trim() : null
    if (data_inicio) updates.data_inicio = data_inicio
    if (data_fim) updates.data_fim = data_fim
    if (local !== undefined) updates.local = local ? local.trim() : null

    if (Object.keys(updates).length === 0) {
       return { success: false, message: 'Entendi o evento, mas não encontrei mudanças de horário, data ou local na sua frase.' }
    }

    const { data, error } = await supabase
      .from('eventos')
      // usar like/ilike para o ID parcial que a IA manda
      .update(updates)
      .or(`id.eq.${evento_id},id.ilike.${evento_id}%`)
      .eq('gabinete_id', gabineteId)
      .select('titulo, data_inicio')
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      console.error('Erro ao atualizar evento agenda:', error)
      return { success: false, message: 'Agenda não encontrada com esse ID ou erro ao atualizar.' }
    }

    return {
      success: true,
      message: `✅ *Agenda Atualizada!*\n\n🚩 ${data.titulo} foi modiifcado com sucesso.`
    }
  } catch (error) {
    console.error('Erro att agenda:', error)
    return { success: false, message: 'Erro interno ao atualizar agenda.' }
  }
}

// Nova Função: Buscar Agendas (Eventos)
async function buscarAgendas(params: any, gabineteId: string): Promise<{ success: boolean, message: string }> {
  try {
    const { data_inicio_busca, data_fim_busca } = params

    let query = supabase
      .from('eventos')
      .select('id, titulo, data_inicio, data_fim, local')
      .eq('gabinete_id', gabineteId)
      .order('data_inicio', { ascending: true })

    if (data_inicio_busca) {
        query = query.gte('data_inicio', data_inicio_busca)
    } else {
        const hojeUTC = new Date()
        // Subtrai 3 horas para fuso e zera
        hojeUTC.setUTCHours(0 - 3,0,0,0)
        query = query.gte('data_inicio', hojeUTC.toISOString())
    }

    if (data_fim_busca) {
        query = query.lte('data_fim', data_fim_busca)
    }

    query = query.limit(10)

    const { data, error } = await query

    if (error) {
       console.error('Erro na consulta de eventos banco:', error)
       return { success: false, message: 'Falha ao buscar agendas.' }
    }

    if (!data || data.length === 0) {
      return { success: true, message: `📅 Nenhuma agenda cadastrada no sistema para este período.` }
    }

    let message = `📅 *Resultados da Agenda:*\n\n`
    data.forEach((item) => {
      const dInicio = new Date(item.data_inicio).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      message += `🔹 *${item.titulo}*\n🕒 ${dInicio}\n📍 ${item.local || 'Não informado'}\n🔑 ID: ${item.id.substring(0, 8)}\n\n`
    })

    return { success: true, message }
  } catch (error) {
    console.error('Erro lista ag:', error)
    return { success: false, message: 'Erro lógico ao buscar agendas.' }
  }
}

// Função para consultar status
async function consultarStatus(params: any, gabineteId: string): Promise<{ success: boolean, message: string }> {
  try {
    const { tipo, id } = params

    if (!tipo || !id) {
      return { success: false, message: 'Tipo e ID são obrigatórios para consultar status.' }
    }

    let query
    let tableName = ''

    switch (tipo.toLowerCase()) {
      case 'demanda':
      case 'demandas':
        tableName = 'demandas_whatsapp'
        break
      case 'indicacao':
      case 'indicacoes':
        tableName = 'indicacoes_whatsapp'
        break
      case 'ideia':
      case 'ideias':
        tableName = 'ideias_whatsapp'
        break
      default:
        return { success: false, message: 'Tipo inválido. Use: demanda, indicacao ou ideia.' }
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('gabinete_id', gabineteId)
      .or(`id.eq.${id},id.ilike.${id}%`)
      .limit(1)
      .single()

    if (error || !data) {
      return { success: false, message: `${tipo} não encontrada com ID: ${id}` }
    }

    let statusMessage = `📊 Status de ${tipo}:\n\n`
    statusMessage += `🏷️ Título: ${data.titulo}\n`
    statusMessage += `📅 Criado: ${new Date(data.created_at).toLocaleDateString('pt-BR')}\n`

    if (data.status) {
      statusMessage += `🔄 Status: ${data.status}\n`
    }

    if (data.descricao) {
      statusMessage += `📝 Descrição: ${data.descricao.substring(0, 100)}${data.descricao.length > 100 ? '...' : ''}\n`
    }

    return { success: true, message: statusMessage }
  } catch (error) {
    console.error('Erro na consulta de status:', error)
    return { success: false, message: 'Erro interno na consulta.' }
  }
}

// Função para listar itens do usuário
async function listarItens(params: any, gabineteId: string): Promise<{ success: boolean, message: string }> {
  try {
    const { tipo } = params

    if (!tipo) {
      return { success: false, message: 'Tipo é obrigatório. Use: eleitores, demandas, indicacoes ou ideias.' }
    }

    let tableName = ''
    let emoji = ''
    let columns = 'id, created_at'

    switch (tipo.toLowerCase()) {
      case 'eleitor':
      case 'eleitores':
        tableName = 'eleitores_whatsapp'
        emoji = '👥'
        columns += ', nome, telefone, bairro'
        break
      case 'demanda':
      case 'demandas':
        tableName = 'demandas_whatsapp'
        emoji = '🎯'
        columns += ', titulo, status'
        break
      case 'indicacao':
      case 'indicacoes':
        tableName = 'indicacoes_whatsapp'
        emoji = '📋'
        columns += ', titulo, status'
        break
      case 'ideia':
      case 'ideias':
        tableName = 'ideias_whatsapp'
        emoji = '💡'
        columns += ', titulo, status' // ideias pode nao ter status dependendo do projeto, mas via de regra aceita
        break
      default:
        return { success: false, message: 'Tipo inválido. Use: eleitores, demandas, indicacoes ou ideias.' }
    }

    const { data, error } = await supabase
      .from(tableName)
      .select(columns)
      .eq('gabinete_id', gabineteId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Erro na listagem:', error)
      return { success: false, message: 'Erro ao buscar dados.' }
    }

    if (!data || data.length === 0) {
      return { success: true, message: `${emoji} Nenhum(a) ${tipo} encontrado(a).` }
    }

    let message = `${emoji} Seus ${tipo} (últimos 10):\n\n`

    data.forEach((item, index) => {
      const nomeOuTitulo = item.titulo || item.nome || 'Sem identificação'
      const dataFormatada = new Date(item.created_at).toLocaleDateString('pt-BR')
      const extra = item.status ? ` - Status: ${item.status}` : (item.bairro ? ` - Bairro: ${item.bairro}` : '')
      message += `${index + 1}. ${nomeOuTitulo}${extra}\n   📅 ${dataFormatada} | ID: ${item.id.toString().substring(0, 8)}\n\n`
    })

    return { success: true, message }
  } catch (error) {
    console.error('Erro na listagem:', error)
    return { success: false, message: 'Erro interno na listagem.' }
  }
}

function obterAjuda(userRole: string): { success: boolean, message: string } {
  let message = `🤖 *Agente IA Legisfy - WhatsApp*\n\n`

  message += `📋 *Comandos disponíveis para ${userRole}:*\n\n`

  if (['politico', 'chefe_gabinete', 'assessor'].includes(userRole)) {
    message += `👥 *Eleitores:*\n`
    message += `• "cadastrar eleitor [nome] [telefone] [endereço]"\n`
    message += `• "meus eleitores"\n\n`

    message += `📋 *Indicações:*\n`
    message += `• "criar indicacao [título] - [descrição]"\n`
    message += `• "minhas indicacoes"\n\n`

    message += `🎯 *Demandas:*\n`
    message += `• "registrar demanda [título] - [descrição]"\n`
    message += `• "minhas demandas"\n\n`
  }

  if (['politico', 'chefe_gabinete', 'assessor', 'atendente'].includes(userRole)) {
    message += `💡 *Ideias:*\n`
    message += `• "cadastrar ideia [título] - [descrição]"\n`
    message += `• "minhas ideias"\n\n`
    
    message += `📅 *Agenda do Mandato:*\n`
    message += `Você pode pedir em conversa natural, como:\n`
    message += `• "Marca uma reunião amanhã às 14h com o Prefeito no Centro."\n`
    message += `• "Quais as minhas agendas para amanhã?"\n\n`
  }

  message += `📊 *Consultas:*\n`
  message += `• "status [tipo] [id]" - consultar status\n`
  message += `• "ajuda" - ver comandos\n\n`

  message += `💬 *Exemplos:*\n`
  message += `• "cadastrar eleitor João Silva 11999999999 Rua das Flores, 123"\n`
  message += `• "criar indicacao Iluminação na praça - Melhorar a iluminação da praça central"\n`
  message += `• "status demanda a1b2c3d4"\n\n`

  message += `📧 Você também pode enviar áudios e imagens que serão processados automaticamente!`

  return { success: true, message }
}

function parseManualCommand(userText: string): { action: string, parameters: any } | null {
  const text = userText.trim()
  const lower = text.toLowerCase()

  if (lower === 'ajuda' || lower.startsWith('ajuda ')) {
    return { action: 'obter_ajuda', parameters: {} }
  }

  if (lower.startsWith('meus eleitores') || lower.startsWith('meus eleitor')) {
    return { action: 'listar_itens', parameters: { tipo: 'eleitores' } }
  }

  if (lower.startsWith('minhas demandas') || lower.startsWith('minha demanda')) {
    return { action: 'listar_itens', parameters: { tipo: 'demandas' } }
  }

  if (lower.startsWith('minhas indicacoes') || lower.startsWith('minhas indicações') || lower.startsWith('minha indicacao')) {
    return { action: 'listar_itens', parameters: { tipo: 'indicacoes' } }
  }

  if (lower.startsWith('minhas ideias') || lower.startsWith('minha ideia')) {
    return { action: 'listar_itens', parameters: { tipo: 'ideias' } }
  }

  if (lower.startsWith('status ')) {
    const parts = text.split(/\s+/)
    if (parts.length >= 3) {
      return {
        action: 'consultar_status',
        parameters: {
          tipo: parts[1],
          id: parts[2]
        }
      }
    }
  }

  const saudacoes = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'tudo bem?']
  if (saudacoes.includes(lower)) {
    return { action: 'chat', parameters: { text: '' } } // Força o fallback de boas vindas
  }

  if (lower.startsWith('cadastrar eleitor')) {
    const idx = lower.indexOf('cadastrar eleitor') + 'cadastrar eleitor'.length
    const rest = text.slice(idx).trim()
    return {
      action: 'cadastrar_eleitor',
      parameters: {
        nome: rest || 'Eleitor'
      }
    }
  }

  if (lower.startsWith('criar indicacao') || lower.startsWith('criar indicação')) {
    const key = lower.startsWith('criar indicacao') ? 'criar indicacao' : 'criar indicação'
    const idx = lower.indexOf(key) + key.length
    const rest = text.slice(idx).trim()
    const [tituloRaw, descricaoRaw] = rest.split(/[-–—]/, 2)
    const titulo = (tituloRaw || '').trim()
    const descricao = (descricaoRaw || '').trim()
    if (titulo) {
      return {
        action: 'criar_indicacao',
        parameters: {
          titulo,
          descricao: descricao || null
        }
      }
    }
  }

  if (lower.startsWith('registrar demanda')) {
    const idx = lower.indexOf('registrar demanda') + 'registrar demanda'.length
    const rest = text.slice(idx).trim()
    const [tituloRaw, descricaoRaw] = rest.split(/[-–—]/, 2)
    const titulo = (tituloRaw || '').trim()
    const descricao = (descricaoRaw || '').trim()
    if (titulo) {
      return {
        action: 'registrar_demanda',
        parameters: {
          titulo,
          descricao: descricao || null
        }
      }
    }
  }

  if (lower.startsWith('cadastrar ideia')) {
    const idx = lower.indexOf('cadastrar ideia') + 'cadastrar ideia'.length
    const rest = text.slice(idx).trim()
    const [tituloRaw, descricaoRaw] = rest.split(/[-–—]/, 2)
    const titulo = (tituloRaw || '').trim()
    const descricao = (descricaoRaw || '').trim()
    if (titulo) {
      return {
        action: 'cadastrar_ideia',
        parameters: {
          titulo,
          descricao: descricao || null
        }
      }
    }
  }

  return null
}

async function parseActionWithAI(userText: string, userRole: string, userName?: string): Promise<{ action: string, parameters: any }> {
  try {
    const dataHoraAtual = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const systemPrompt = `Você é um parser de comandos para o sistema Legisfy WhatsApp. 

OBJETIVO: Analisar a mensagem do usuário e extrair a ação e parâmetros. Você é um Assessor IA proativo.

> DATA E HORA DE AGORA: ${dataHoraAtual} (Use isso para fundamentar cálculos relativos como "amanhã", "hoje de tarde"). Assuma Fuso Horário de Brasília (BRT/BRST) UTC-03:00.

AÇÕES VÁLIDAS:
- cadastrar_agenda: {titulo, descricao?, data_inicio (formato ISO8601), data_fim (formato ISO8601), local?} // Para eventos do calendário. (Se o usuário der apenas um horário, deduza o fim como 1h após o início).
- atualizar_agenda: {evento_id, titulo?, descricao?, data_inicio? (ISO8601), data_fim? (ISO8601), local?} // Reagendar ou editar evento existente. Exige o ID do evento (ex: "reagendar reunião id 12ab34cd para amanhã").
- buscar_agenda: {data_inicio_busca? (ISO8601), data_fim_busca? (ISO8601)} // Para consultar agendas marcadas.
- cadastrar_eleitor: {nome, telefone?, endereco?, tags?} (Use para: cadastrar, novo eleitor, registrar contato)
- criar_indicacao: {titulo, descricao?} (Use para: nova indicação, criar lei, sugestão de projeto)
- registrar_demanda: {titulo, descricao?, anexos?} (Use para: nova demanda, pedido de munícipe, reclamação, protocolo)
- cadastrar_ideia: {titulo, descricao?, anexos?} (Use para: nova ideia, insights, sugestões internas)
- consultar_status: {tipo, id}
- listar_itens: {tipo} // (Use para listar, contar, ver, checar ou mostrar: eleitores, demandas, indicacoes, ideias. Ex: "quantas demandas", "mostrar meus eleitores")
- consultar_email: {}
- consultar_agenda_google: {} // Legado: Para agenda do gmail. Prefira "buscar_agenda" se for agenda nativa.
- obter_ajuda: {}
- chat: {text} // **APENAS** se o usuário estiver conectando conversa, fazendo uma pergunta genérica, ou dizendo "Oi". NUNCA coloque um JSON dentro do 'text'. 

INSTRUÇÕES CRÍTICAS:
1. PRIORIDADE MÁXIMA PARA AÇÕES ESPECÍFICAS DE CRUD E LISTAGENS. Retorne APENAS JSON válido, sem formato markdown.
2. IMPORTANTE PARA AGENDA: Converta referências de data com base na DATA E HORA DE AGORA para um ISO8601 em UTC-03:00 (Ex: se hoje é 23/10 10:00 e o user diz amanhã as 15h, data_inicio="2024-10-24T15:00:00-03:00").
3. IMPORTANTE PARA LISTAGENS: Se o usuário pedir quantidade, total, histórico ou lista de algo (demandas, indicações, ideias, eleitores) use 'listar_itens' e defina o parâmetro 'tipo'. NUNCA use 'chat' para esses casos.

CARGO DO USUÁRIO: ${userRole}
NOME DO USUÁRIO: ${userName || 'Usuário'}
`

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
    
    console.log(`Chamando Anthropic (Claude 3.5 Sonnet) para o usuário ${userName || 'Usuário'}...`)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: "MENSAGEM DO USUÁRIO: " + userText }
        ],
        temperature: 0,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro na API Anthropic (status ${response.status}): ${errorText}`)
      throw new Error(`Erro na API Anthropic: ${response.status}`)
    }

    const result = await response.json()
    const content = result.content?.[0]?.text || '{}'
    console.log('Resposta bruta do parser IA (Anthropic):', content)

    try {
      // Remover possíveis blocos de código markdown se a IA os incluir
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.substring(7);
      else if (jsonStr.startsWith('```')) jsonStr = jsonStr.substring(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      jsonStr = jsonStr.trim();
      
      let parsed = JSON.parse(jsonStr)

      const validActions = [
        'cadastrar_agenda', 'atualizar_agenda', 'buscar_agenda', 'cadastrar_eleitor',
        'criar_indicacao', 'registrar_demanda', 'cadastrar_ideia', 'consultar_status',
        'listar_itens', 'consultar_email', 'consultar_agenda_google', 'obter_ajuda', 'chat'
      ];

      // Se a IA inventar uma ação, forçamos para chat e passamos o texto original (ou o que ela tentou dizer)
      if (!parsed.action || !validActions.includes(parsed.action)) {
         parsed = { action: 'chat', parameters: { text: parsed.text || parsed.message || parsed.resposta || content } }
      }

      // Se a IA mandou {"action": "chat", "text": "bla bla"} ao inves de parameters.text
      if (parsed.action === 'chat' && (!parsed.parameters || typeof parsed.parameters.text !== 'string')) {
         const fallbackText = parsed.text || parsed.message || parsed.resposta || content
         parsed.parameters = { text: typeof fallbackText === 'string' ? fallbackText : JSON.stringify(fallbackText) }
      }

      return parsed

    } catch {
      return { action: 'chat', parameters: { text: content } }
    }
  } catch (error) {
    console.error('Erro no parser IA:', error)
    return { action: 'chat', parameters: { text: `No momento tive um problema técnico (${error.message}). Pode repetir?` } }
  }
}

// Handler principal
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let { action, parameters, userId, userName, gabineteId, userRole, userText, audioBase64 } = await req.json() as ActionRequest

    // Processar áudio com Whisper se existir
    if (audioBase64) {
      console.log('🎙️ Áudio recebido, convertendo para texto com Whisper...');
      try {
        const byteCharacters = atob(audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/ogg' });

        const formData = new FormData();
        formData.append('file', blob, 'audio.ogg');
        formData.append('model', 'whisper-1');

        const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: formData
        });

        if (whisperRes.ok) {
          const transcription = await whisperRes.json();
          userText = transcription.text;
          console.log(`✅ Áudio transcrito: "${userText}"`);
        } else {
          console.error('❌ Erro no Whisper API:', await whisperRes.text());
        }
      } catch (err) {
        console.error('❌ Erro local ao processar áudio para Whisper:', err);
      }
    }


    if (!action && userText) {
      const manual = parseManualCommand(userText)
      const parsed = manual || await parseActionWithAI(userText, userRole, userName)

      if (parsed.action === 'sem_permissao') {
        return new Response(JSON.stringify({
          success: false,
          message: `❌ Você não tem permissão para executar esta ação.\n\nSeu cargo: ${userRole}\n\nDigite "ajuda" para ver os comandos disponíveis.`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (parsed.action === 'esclarecer') {
        return new Response(JSON.stringify({
          success: false,
          message: `🤔 Não entendi completamente. Você quis dizer:\n\n${parsed.parameters.opcoes?.map((op: string, i: number) => `${i + 1}. ${op}`).join('\n')}\n\nOu digite "ajuda" para ver todos os comandos.`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (parsed.action === 'dados_faltantes') {
        return new Response(JSON.stringify({
          success: false,
          message: `📝 Faltam algumas informações:\n\n${parsed.parameters.campos_necessarios?.map((campo: string) => `• ${campo}`).join('\n')}\n\nTente novamente com os dados completos.`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Executar ação parseada
      action = parsed.action
      parameters = parsed.parameters
    }

    let result: { success: boolean, message: string, data?: any }
    
    // Executar ação (agora unificada)
    switch (action) {
      case 'cadastrar_agenda':
        result = await cadastrarAgenda(parameters, gabineteId, userId)
        break
      case 'atualizar_agenda':
        result = await atualizarAgenda(parameters, gabineteId, userId)
        break
      case 'buscar_agenda':
        result = await buscarAgendas(parameters, gabineteId)
        break
      case 'cadastrar_eleitor':
        result = await cadastrarEleitor(parameters, gabineteId)
        break
      case 'criar_indicacao':
        result = await criarIndicacao(parameters, gabineteId)
        break
      case 'registrar_demanda':
        result = await registrarDemanda(parameters, gabineteId)
        break
      case 'cadastrar_ideia':
        result = await cadastrarIdeia(parameters, gabineteId)
        break
      case 'consultar_status':
        result = await consultarStatus(parameters, gabineteId)
        break
      case 'listar_itens':
        result = await listarItens(parameters, gabineteId)
        break
      case 'consultar_email':
        result = await consultarEmails(gabineteId)
        break
      case 'consultar_agenda_google':
        result = await consultarAgenda(gabineteId)
        break
      case 'obter_ajuda':
        result = obterAjuda(userRole)
        break
      case 'chat': {
        const aiText = typeof parameters?.text === 'string' && parameters.text.trim().length > 0
          ? parameters.text
          : undefined
        
        // Buscar nome do assessor para o prompt
        const { data: assessor } = await supabase
          .from('meu_assessor_ia')
          .select('nome, comportamento')
          .eq('gabinete_id', gabineteId)
          .maybeSingle();
          
        const { data: gabineteData } = await supabase
          .from('gabinetes')
          .select('nome')
          .eq('id', gabineteId)
          .maybeSingle();

        const assessorNome = assessor?.nome || 'Assistente IA';
        let gabineteNome = gabineteData?.nome || 'Legislativo';

        // Evitar redundância de "Gabinete Gabinete..."
        const saudacaoGabinete = gabineteNome.toLowerCase().startsWith('gabinete') 
          ? gabineteNome 
          : `Gabinete ${gabineteNome}`;

        const fallback = `Olá, sou ${assessorNome} Assessor IA do ${saudacaoGabinete}. Como posso te ajudar?`
        result = { success: true, message: aiText || fallback }
        break
      }
      default: {
        result = {
          success: false,
          message: 'Ação não reconhecida. Se quiser ver exemplos, envie "ajuda".'
        }
      }
    }

    // Adicionar metadados do parser para o log de auditoria
    ; (result as any).parsedAction = action
    ; (result as any).parsedParameters = parameters

    // Helper to check if string is UUID
    const isValidUUID = (str: string) => {
      const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
      return regexExp.test(str);
    };

    // Log da ação se for bem-sucedida
    if (result.success && (action || (result as any).parsedAction) !== 'obter_ajuda') {
      const isUUID = isValidUUID(userId);
      await supabase
        .from('audit_log_whatsapp')
        .insert({
          usuario_id: isUUID ? userId : null,
          gabinete_id: gabineteId,
          acao: action || (result as any).parsedAction || 'acao_ia',
          payload_resumido: {
            telefone_se_eleitor: !isUUID ? userId : undefined,
            action: action || (result as any).parsedAction,
            parameters: parameters || (result as any).parsedParameters || {},
            result: result.data
          }
        })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Erro no processamento de ação:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro interno no processamento. Tente novamente.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
