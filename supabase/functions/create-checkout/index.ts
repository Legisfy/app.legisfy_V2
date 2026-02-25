import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  priceId: string;
  plan: string;
}

// Configuração dos planos
const PLANS = {
  starter: {
    priceId: "price_starter_monthly", // Substitua pelos IDs reais do Stripe
    name: "Starter",
    description: "Plano básico para 1 gabinete"
  },
  pro: {
    priceId: "price_pro_monthly",
    name: "Pro", 
    description: "Plano intermediário para gabinetes em crescimento"
  },
  intelligence: {
    priceId: "price_intelligence_monthly",
    name: "Intelligence",
    description: "Plano avançado com IA e automações"
  },
  legacy: {
    priceId: "price_legacy_monthly",
    name: "Legacy",
    description: "Inclui ferramentas avançadas de marketing e automação"
  }
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { priceId, plan }: CheckoutRequest = await req.json();
    if (!priceId || !plan) throw new Error("Missing priceId or plan");
    logStep("Request parsed", { priceId, plan });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Verificar se cliente já existe no Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      // Criar novo cliente
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });

      // Salvar no banco
      await supabaseClient.from('stripe_customers').insert({
        user_id: user.id,
        stripe_customer_id: customerId,
        email: user.email
      });
    }

    // Buscar configurações de customização
    const { data: customizations } = await supabaseClient
      .from('checkout_customizations')
      .select('*')
      .eq('is_active', true)
      .single();

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/assinatura?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/assinatura?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      custom_text: {
        submit: {
          message: 'Ao finalizar, você concorda com os Termos de Serviço da Legisfy'
        }
      },
      metadata: {
        supabase_user_id: user.id,
        plan_name: plan
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});