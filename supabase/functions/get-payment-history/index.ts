import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-PAYMENT-HISTORY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ payments: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get payment intents for this customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 50,
    });

    // Get invoices for subscription payments
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 50,
    });

    const payments = [];

    // Process payment intents (one-time payments)
    for (const payment of paymentIntents.data) {
      if (payment.status === 'succeeded') {
        payments.push({
          id: payment.id,
          date: new Date(payment.created * 1000).toISOString(),
          amount: payment.amount / 100, // Convert from cents
          plan_name: payment.description || 'Pagamento único',
          status: 'completed',
          payment_id: payment.id,
          month_year: new Date(payment.created * 1000).toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
          }),
          type: 'one_time'
        });
      }
    }

    // Process invoices (subscription payments)
    for (const invoice of invoices.data) {
      if (invoice.status === 'paid' && invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const product = await stripe.products.retrieve(
          subscription.items.data[0].price.product as string
        );

        payments.push({
          id: invoice.id,
          date: new Date(invoice.created * 1000).toISOString(),
          amount: invoice.amount_paid / 100, // Convert from cents
          plan_name: product.name,
          status: 'completed',
          payment_id: invoice.payment_intent as string || invoice.id,
          month_year: new Date(invoice.created * 1000).toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
          }),
          type: 'subscription'
        });
      }
    }

    // Sort by date (most recent first)
    payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    logStep("Payment history retrieved", { count: payments.length });

    return new Response(JSON.stringify({ payments }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-payment-history", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, payments: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});