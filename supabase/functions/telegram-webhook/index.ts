import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    let telegramUserId = 0
    try {
        const body = await req.json()
        console.log('Telegram Webhook Payload:', JSON.stringify(body))

        const message = body.message || body.edited_message
        if (!message || !message.text) {
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
        }

        telegramUserId = message.from.id
        const userText = message.text.trim()

        // 1. Comando de Pareamento via Código
        if (userText.startsWith('/start LEG-')) {
            const pairingCode = userText.split(' ')[1]
            if (pairingCode) {
                return await handlePairingCode(telegramUserId, pairingCode)
            }
        }

        // 2. Tentar Pareamento por E-mail
        if (userText.includes('@') && userText.includes('.')) {
            return await handleEmailPairing(telegramUserId, userText)
        }

        // 3. Tentar Pareamento por Telefone
        if (/^\+?[\d\s\-\(\)]+$/.test(userText) && userText.length >= 8) {
            return await handlePhonePairing(telegramUserId, userText)
        }

        // 4. Verificar se já está mapeado
        const { data: mapping } = await supabase
            .from('ia_telegram_users')
            .select('user_id, gabinete_id')
            .eq('telegram_user_id', telegramUserId)
            .maybeSingle()

        if (!mapping) {
            return await sendTelegramMessage(telegramUserId,
                "🤖 **Olá! Eu sou o Assessor IA da Legisfy.**\n\nAinda não identifiquei sua conta. Envie uma das informações abaixo para conectar:\n\n1️⃣ **Código**: Use `/start` + código (ex: `/start LEG-A1B-C2D`)\n2️⃣ **E-mail**: Digite seu e-mail cadastrado.\n3️⃣ **Telefone**: Digite seu celular (ex: `27999998888`)."
            )
        }

        // 5. Processar comando normal (IA)
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, main_role')
            .eq('user_id', mapping.user_id)
            .maybeSingle()

        const { data: aiResult, error: aiError } = await supabase.functions.invoke('whatsapp-ai-actions', {
            body: {
                userId: mapping.user_id,
                userName: profile?.full_name || 'Usuário',
                gabineteId: mapping.gabinete_id,
                userRole: profile?.main_role || 'assessor',
                userText: userText
            }
        })

        if (aiError) throw aiError
        return await sendTelegramMessage(telegramUserId, aiResult.message)

    } catch (error) {
        console.error('Webhook Error:', error)
        // Notificar o usuário se algo falhar, para não ficar no silêncio
        if (telegramUserId) {
            try {
                await sendTelegramMessage(telegramUserId, "❌ Tive um problema técnico ao processar seu pedido. Pode tentar novamente em alguns instantes?")
            } catch (e) {
                console.error('Failed to send error message to Telegram:', e)
            }
        }
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }
})

async function handlePairingCode(telegramUserId: number, pairingCode: string) {
    const parts = pairingCode.replace('LEG-', '').split('-')
    if (parts.length < 2) return await sendTelegramMessage(telegramUserId, "❌ Código inválido.")

    const [cabPrefix, userSuffix] = [parts[0].toLowerCase(), parts[1].toLowerCase()]

    const { data: cabinets } = await supabase.from('gabinetes').select('id')
    const matchedCabs = cabinets?.filter(c => c.id.toLowerCase().startsWith(cabPrefix)) || []

    for (const cab of matchedCabs) {
        const { data: members } = await supabase.from('gabinete_usuarios').select('user_id').eq('gabinete_id', cab.id)
        const member = members?.find(m => m.user_id.toLowerCase().endsWith(userSuffix))

        if (member) {
            return await finalizePairing(telegramUserId, member.user_id, cab.id, "via código")
        }
    }
    return await sendTelegramMessage(telegramUserId, "❌ Não encontrei gabinete/usuário para este código.")
}

async function handleEmailPairing(telegramUserId: number, email: string) {
    const normalizedEmail = email.toLowerCase().trim()

    // Buscar no view profiles/auth.users
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').ilike('email', normalizedEmail)
    const profile = profiles?.[0]

    if (!profile) {
        // Fallback para buscar diretamente no auth se o profile não tiver email (raro)
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const targetUser = users?.find(u => u.email?.toLowerCase() === normalizedEmail)

        if (!targetUser) {
            return await sendTelegramMessage(telegramUserId, "❌ Não encontrei nenhuma conta com o e-mail: " + email)
        }

        const { data: member } = await supabase.from('gabinete_usuarios').select('gabinete_id').eq('user_id', targetUser.id).maybeSingle()
        if (!member) return await sendTelegramMessage(telegramUserId, "❌ Conta encontrada, mas sem gabinete vinculado.")

        return await finalizePairing(telegramUserId, targetUser.id, member.gabinete_id, "via e-mail")
    }

    const { data: member } = await supabase.from('gabinete_usuarios').select('gabinete_id').eq('user_id', profile.user_id).maybeSingle()
    if (!member) return await sendTelegramMessage(telegramUserId, "❌ Conta encontrada, mas sem gabinete vinculado.")

    return await finalizePairing(telegramUserId, profile.user_id, member.gabinete_id, "via e-mail")
}

async function handlePhonePairing(telegramUserId: number, phone: string) {
    const cleanPhone = phone.replace(/\D/g, '')
    const { data: profiles } = await supabase.from('profiles').select('user_id, whatsapp')
    const profile = profiles?.find(p => p.whatsapp?.replace(/\D/g, '').endsWith(cleanPhone) || cleanPhone.endsWith(p.whatsapp?.replace(/\D/g, '') || ''))

    if (!profile) {
        return await sendTelegramMessage(telegramUserId, "❌ Não encontrei conta com o telefone: " + phone)
    }

    const { data: member } = await supabase.from('gabinete_usuarios').select('gabinete_id').eq('user_id', profile.user_id).maybeSingle()
    if (!member) return await sendTelegramMessage(telegramUserId, "❌ Conta encontrada, mas sem gabinete vinculado.")

    return await finalizePairing(telegramUserId, profile.user_id, member.gabinete_id, "via telefone")
}

async function finalizePairing(telegramUserId: number, userId: string, gabineteId: string, method: string) {
    // 1. Vincular no banco
    await supabase.from('ia_telegram_users').upsert({
        telegram_user_id: telegramUserId,
        user_id: userId,
        gabinete_id: gabineteId
    })

    // 2. Buscar detalhes para a mensagem personalizada
    const { data: profile } = await supabase.from('profiles').select('full_name, main_role').eq('user_id', userId).maybeSingle()
    const { data: gabinete } = await supabase.from('gabinetes').select('nome').eq('id', gabineteId).maybeSingle()

    let welcomeMsg = ""
    const nameParts = profile?.full_name?.split(' ') || []
    const firstTwoNames = nameParts.slice(0, 2).join(' ')

    if (profile?.main_role === 'politico') {
        welcomeMsg = `✅ **Conectado com sucesso ${method}!**\n\nBem-vindo, **Vereador ${profile.full_name}**.\n\nIdentifiquei seu acesso ao **${gabinete?.nome}**. Agora você já pode me enviar comandos ou áudios.`
    } else {
        welcomeMsg = `✅ **Conectado com sucesso ${method}!**\n\nOlá, **${firstTwoNames}**.\n\nJá identifiquei seu acesso ao **${gabinete?.nome}**. Estou pronto para te ajudar no dia a dia do gabinete.`
    }

    return await sendTelegramMessage(telegramUserId, welcomeMsg)
}

async function sendTelegramMessage(chatId: number, text: string) {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
        console.error('TELEGRAM_BOT_TOKEN is not set!')
        throw new Error('Telegram configuration error')
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    console.log(`Sending message to ${chatId}...`)

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }) // Changed to HTML for safety
    })

    if (!response.ok) {
        const errorData = await response.json()
        console.error('Telegram API Error:', JSON.stringify(errorData))
        throw new Error(`Telegram API: ${response.status} ${JSON.stringify(errorData)}`)
    }

    return response
}
