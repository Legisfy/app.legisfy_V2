import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
const REDIRECT_URI = `${supabaseUrl}/functions/v1/google-oauth-handler`

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
        // 1. Trocar o código por tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        })

        const tokens = await tokenResponse.json()
        if (tokens.error) {
            throw new Error(tokens.error_description || tokens.error)
        }

        // 2. Salvar tokens no banco (ia_integrations)
        const { error: dbError } = await supabase
            .from('ia_integrations')
            .upsert({
                gabinete_id: state,
                google_refresh_token: tokens.refresh_token,
                google_access_token: tokens.access_token,
                google_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                google_enabled: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'gabinete_id' })

        if (dbError) throw dbError

        // 3. Redirecionar de volta para o app
        return new Response(null, {
            status: 302,
            headers: {
                ...corsHeaders,
                'Location': `https://app.legisfy.app.br/conectar-assessor?google=success`,
            },
        })

    } catch (error) {
        console.error('OAuth Error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }
})
