import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// WhatsApp configuration
const WHATSAPP_VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN')!

serve(async (req) => {
  console.log('=== WEBHOOK CHAMADO ===')
  console.log('Method:', req.method)
  console.log('URL completa:', req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Returning CORS preflight response')
    return new Response(null, { headers: corsHeaders })
  }

  // Webhook verification (GET) - Verificação do Meta
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url)
      console.log('URL object:', url.href)
      console.log('Search params:', url.searchParams.toString())
      
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      console.log('=== PARÂMETROS RECEBIDOS ===')
      console.log('hub.mode:', mode)
      console.log('hub.verify_token:', token)
      console.log('hub.challenge:', challenge)
      console.log('Token esperado:', WHATSAPP_VERIFY_TOKEN)
      console.log('Tokens são iguais?', token === WHATSAPP_VERIFY_TOKEN)

      // Verificar se todos os parâmetros necessários estão presentes
      if (!mode || !token || !challenge) {
        console.log('❌ Parâmetros obrigatórios ausentes')
        return new Response('Bad Request - Missing parameters', { 
          status: 400,
          headers: corsHeaders 
        })
      }

      // Verificar se o modo é 'subscribe' e o token confere
      if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
        console.log('✅ Webhook verificado com sucesso - retornando challenge:', challenge)
        return new Response(challenge, { 
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain'
          }
        })
      } else {
        console.log('❌ Falha na verificação do webhook')
        console.log('Mode válido?', mode === 'subscribe')
        console.log('Token válido?', token === WHATSAPP_VERIFY_TOKEN)
        return new Response('Forbidden', { 
          status: 403, 
          headers: corsHeaders 
        })
      }
    } catch (error) {
      console.error('Erro no processamento GET:', error)
      return new Response('Internal Server Error', { 
        status: 500, 
        headers: corsHeaders 
      })
    }
  }

  // Processar mensagens (POST) - Recebimento de mensagens
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      console.log('📨 Mensagem recebida do WhatsApp:', JSON.stringify(body, null, 2))

      // Confirmar recebimento para o Meta
      return new Response('EVENT_RECEIVED', { 
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain'
        }
      })
    } catch (error) {
      console.error('Erro ao processar mensagem POST:', error)
      return new Response('Erro ao processar', { 
        status: 500, 
        headers: corsHeaders 
      })
    }
  }

  console.log('❌ Método não suportado:', req.method)
  return new Response('Método não suportado', { 
    status: 405, 
    headers: corsHeaders 
  })
})