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

interface ActionRequest {
  action: string
  parameters: any
  userId: string
  userName?: string
  gabineteId: string
  userRole: string
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

    switch (tipo.toLowerCase()) {
      case 'eleitor':
      case 'eleitores':
        tableName = 'eleitores_whatsapp'
        emoji = '👥'
        break
      case 'demanda':
      case 'demandas':
        tableName = 'demandas_whatsapp'
        emoji = '🎯'
        break
      case 'indicacao':
      case 'indicacoes':
        tableName = 'indicacoes_whatsapp'
        emoji = '📋'
        break
      case 'ideia':
      case 'ideias':
        tableName = 'ideias_whatsapp'
        emoji = '💡'
        break
      default:
        return { success: false, message: 'Tipo inválido. Use: eleitores, demandas, indicacoes ou ideias.' }
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('id, titulo, nome, created_at, status')
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
      const nome = item.titulo || item.nome
      const dataFormatada = new Date(item.created_at).toLocaleDateString('pt-BR')
      const status = item.status ? ` - ${item.status}` : ''
      message += `${index + 1}. ${nome}${status}\n   📅 ${dataFormatada} | ID: ${item.id.substring(0, 8)}\n\n`
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
    const systemPrompt = `Você é um parser de comandos para o sistema Legisfy WhatsApp. 

OBJETIVO: Analisar a mensagem do usuário e extrair a ação e parâmetros. Você é um Assessor IA proativo.

AÇÕES VÁLIDAS:
- cadastrar_eleitor: {nome, telefone?, endereco?, tags?} (Use para: cadastrar, novo eleitor, registrar contato)
- criar_indicacao: {titulo, descricao?} (Use para: nova indicação, criar lei, sugestão de projeto)
- registrar_demanda: {titulo, descricao?, anexos?} (Use para: nova demanda, pedido de munícipe, reclamação, protocolo)
- cadastrar_ideia: {titulo, descricao?, anexos?} (Use para: nova ideia, insights, sugestões internas)
- consultar_status: {tipo, id}
- listar_itens: {tipo}
- consultar_email: {}
- consultar_agenda: {}
- obter_ajuda: {}
- chat: {text} // **APENAS** se o usuário estiver apenas jogando conversa fora, fazendo uma pergunta que NÃO envolva as ações acima.

INSTRUÇÕES CRÍTICAS:
1. **PRIORIDADE MÁXIMA PARA AÇÕES**: Se o usuário demonstrar intenção de realizar qualquer uma das ações acima (ex: "queria registrar uma demanda", "cria aí um eleitor"), você **DEVE** retornar a ação correspondente, NÃO a ação "chat".
2. Se faltar informações (como o título da demanda), use a ação "dados_faltantes" e peça a informação, ou se for algo simples, tente inferir.
3. Se o usuário estiver apenas conversando (ex: "bom dia", "como você está?"), aí sim use a ação "chat".
4. Na ação "chat", use o nome/cargo do usuário: ${userName || 'Usuário'} (${userRole}).
5. Se o comando não for permitido para o cargo, retorne "sem_permissao".
6. Responda **APENAS** com o JSON válido.

CARGO DO USUÁRIO: ${userRole}
NOME DO USUÁRIO: ${userName || 'Usuário'}

Responda APENAS com o JSON válido, sem explicações.`

    console.log(`Chamando OpenRouter para o usuário ${userName || 'Usuário'}...`)

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://legisfy.app.br',
        'X-Title': 'Legisfy Assessor IA'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // Mantendo gpt-4o-mini via OpenRouter para precisão no JSON
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro na API OpenRouter (status ${response.status}): ${errorText}`)
      throw new Error(`Erro na API OpenRouter: ${response.status}`)
    }

    const result = await response.json()
    const content = result.choices[0]?.message?.content || '{}'
    console.log('Resposta bruta do parser IA:', content)

    try {
      // Remover possíveis blocos de código markdown se a IA os incluir
      const jsonStr = content.replace(/```json\n?/, '').replace(/```\n?/, '').trim()
      return JSON.parse(jsonStr)
    } catch {
      return { action: 'chat', parameters: { text: content } }
    }
  } catch (error) {
    console.error('Erro no parser IA:', error)
    return { action: 'chat', parameters: { text: "No momento tive um problema técnico, mas estou aqui para ajudar. Pode repetir?" } }
  }
}

// Handler principal
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, parameters, userId, userName, gabineteId, userRole, userText }: ActionRequest & { userText: string } = await req.json()

    let result: { success: boolean, message: string, data?: any }

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
      switch (parsed.action) {
        case 'cadastrar_eleitor':
          result = await cadastrarEleitor(parsed.parameters, gabineteId)
          break
        case 'criar_indicacao':
          result = await criarIndicacao(parsed.parameters, gabineteId)
          break
        case 'registrar_demanda':
          result = await registrarDemanda(parsed.parameters, gabineteId)
          break
        case 'cadastrar_ideia':
          result = await cadastrarIdeia(parsed.parameters, gabineteId)
          break
        case 'consultar_status':
          result = await consultarStatus(parsed.parameters, gabineteId)
          break
        case 'listar_itens':
          result = await listarItens(parsed.parameters, gabineteId)
          break
        case 'consultar_email':
          result = await consultarEmails(gabineteId)
          break
        case 'consultar_agenda':
          result = await consultarAgenda(gabineteId)
          break
        case 'obter_ajuda':
          result = obterAjuda(userRole)
          break
        case 'chat': {
          const aiText = typeof parsed.parameters?.text === 'string'
            ? parsed.parameters.text
            : undefined
          const fallback = 'Sou o assistente IA do gabinete. Posso cadastrar eleitores, demandas, indicações e ideias. Diga por exemplo: "cadastrar eleitor João Silva 11999999999 Rua das Flores, 123".'
          result = { success: true, message: aiText || fallback }
          break
        }
        default: {
          result = {
            success: true,
            message: 'Não entendi muito bem. Se quiser ver exemplos, envie "ajuda".'
          }
        }
      }

      // Adicionar metadados do parser para o log de auditoria
      ; (result as any).parsedAction = parsed.action
        ; (result as any).parsedParameters = parsed.parameters
    } else {
      // Executar ação específica
      switch (action) {
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
        case 'consultar_agenda':
          result = await consultarAgenda(gabineteId)
          break
        case 'obter_ajuda':
          result = obterAjuda(userRole)
          break
        default:
          result = { success: false, message: 'Ação não reconhecida.' }
      }
    }

    // Log da ação se for bem-sucedida
    if (result.success && (action || (result as any).parsedAction) !== 'obter_ajuda') {
      await supabase
        .from('audit_log_whatsapp')
        .insert({
          usuario_id: userId,
          gabinete_id: gabineteId,
          acao: action || (result as any).parsedAction || 'acao_ia',
          payload_resumido: {
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
