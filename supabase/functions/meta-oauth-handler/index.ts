import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const META_APP_ID = Deno.env.get('META_APP_ID')
const META_APP_SECRET = Deno.env.get('META_APP_SECRET')
// A REDIRECT_URI deve ser a URL desta função
const REDIRECT_URI = `${supabaseUrl}/functions/v1/meta-oauth-handler`

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // Onde passamos o gabinete_id

    if (!code || !state) {
        return new Response(JSON.stringify({ error: 'Código ou Estado ausente' }), { status: 400, headers: corsHeaders })
    }

    try {
        console.log(`Iniciando troca de token para o gabinete: ${state}`)

        // 1. Trocar o código por um token de curta duração
        const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${REDIRECT_URI}&client_secret=${META_APP_SECRET}&code=${code}`)
        const tokenData = await tokenResponse.json()

        if (tokenData.error) {
            throw new Error(tokenData.error.message || 'Erro ao obter access token')
        }

        const shortLivedToken = tokenData.access_token

        // 2. Trocar por um token de longa duração (60 dias)
        const longLivedResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`)
        const longLivedData = await longLivedResponse.json()
        
        const longLivedToken = longLivedData.access_token

        // 3. Buscar as Páginas do Usuário para obter o Page ID e Instagram ID
        const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedToken}`)
        const pagesData = await pagesResponse.json()

        if (!pagesData.data || pagesData.data.length === 0) {
            throw new Error('Nenhuma página do Facebook encontrada vinculada a este perfil.')
        }

        // Pegamos a primeira página (como padrão)
        const principalPage = pagesData.data[0]
        const pageId = principalPage.id
        const pageAccessToken = principalPage.access_token // Token da página é o que usamos para métricas

        // 4. Buscar o Perfil de Instagram Business vinculado a essa página
        const igResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`)
        const igData = await igResponse.json()
        
        const instagramId = igData.instagram_business_account?.id || null

        // 5. Salvar no Banco
        const { error: dbError } = await supabase
            .from('ia_integrations')
            .upsert({
                gabinete_id: state,
                meta_access_token: pageAccessToken,
                meta_page_id: pageId,
                meta_instagram_id: instagramId,
                facebook_enabled: true,
                instagram_enabled: !!instagramId,
                updated_at: new Date().toISOString()
            }, { onConflict: 'gabinete_id' })

        if (dbError) throw dbError

        // 6. Redirecionar de volta para o Dashboard
        // Nota: O domínio real deve ser configurado ou detectado
        const origin = url.origin.includes('localhost') ? 'http://localhost:8080' : 'https://app.legisfy.app.br'
        
        return new Response(null, {
            status: 302,
            headers: {
                ...corsHeaders,
                'Location': `${origin}/redes-sociais?meta=success`,
            },
        })

    } catch (error) {
        console.error('Meta OAuth Error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }
})
