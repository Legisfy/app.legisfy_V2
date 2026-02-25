import React, { useState } from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckoutButton } from '@/components/stripe/CheckoutButton';
import { SubscriptionStatus } from '@/components/stripe/SubscriptionStatus';
import { useSubscription } from '@/hooks/useSubscription';
import { Check, Star, Zap, Crown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

// Configuração dos planos - SUBSTITUA os price IDs pelos reais do Stripe
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Plano básico para 1 gabinete',
    monthlyPrice: 29700, // R$ 297,00 em centavos
    yearlyPrice: 299700, // R$ 2.997,00 em centavos (desconto de 20%)
    priceIdMonthly: 'price_starter_monthly', // SUBSTITUIR pelo ID real
    priceIdYearly: 'price_starter_yearly', // SUBSTITUIR pelo ID real
    icon: Shield,
    color: 'from-blue-500 to-cyan-500',
    features: [
      'Até 1 gabinete',
      'Gerenciamento básico de eleitores',
      'Controle de demandas',
      'Agenda integrada',
      'Relatórios simples',
      'Suporte por email'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Plano intermediário para gabinetes em crescimento',
    monthlyPrice: 69700, // R$ 697,00 em centavos
    yearlyPrice: 699700, // R$ 6.997,00 em centavos
    priceIdMonthly: 'price_pro_monthly', // SUBSTITUIR pelo ID real
    priceIdYearly: 'price_pro_yearly', // SUBSTITUIR pelo ID real
    icon: Zap,
    color: 'from-green-500 to-emerald-500',
    popular: true,
    features: [
      'Até 3 gabinetes',
      'CRM avançado de eleitores',
      'Automação de demandas',
      'Indicações legislativas',
      'WhatsApp integrado',
      'Relatórios avançados',
      'Suporte prioritário'
    ]
  },
  {
    id: 'intelligence',
    name: 'Intelligence',
    description: 'Plano avançado com IA e automações',
    monthlyPrice: 199700, // R$ 1.997,00 em centavos
    yearlyPrice: 1999700, // R$ 19.997,00 em centavos
    priceIdMonthly: 'price_intelligence_monthly', // SUBSTITUIR pelo ID real
    priceIdYearly: 'price_intelligence_yearly', // SUBSTITUIR pelo ID real
    icon: Crown,
    color: 'from-purple-500 to-pink-500',
    features: [
      'Gabinetes ilimitados',
      'Assistente IA avançado',
      'Automação completa',
      'Analytics preditiva',
      'API personalizada',
      'Integrações avançadas',
      'Suporte dedicado 24/7'
    ]
  },
  {
    id: 'legacy',
    name: 'Legacy',
    description: 'Inclui ferramentas avançadas de marketing e automação',
    monthlyPrice: 399700, // R$ 3.997,00 em centavos
    yearlyPrice: null, // Apenas mensal
    priceIdMonthly: 'price_legacy_monthly', // SUBSTITUIR pelo ID real
    priceIdYearly: null,
    icon: Star,
    color: 'from-yellow-500 to-orange-500',
    features: [
      'Todos os recursos do Intelligence',
      'Marketing político avançado',
      'Campanha digital completa',
      'Análise de redes sociais',
      'Consultoria estratégica',
      'Treinamento da equipe',
      'White-label disponível'
    ]
  }
];

export default function AssinaturaStripe() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { subscribed, plan: currentPlan } = useSubscription();

  const formatPrice = (priceInCents: number | null) => {
    if (!priceInCents) return 'Sob consulta';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(priceInCents / 100);
  };

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyTotal = monthlyPrice * 12;
    return monthlyTotal - yearlyPrice;
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 text-white">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative max-w-7xl mx-auto px-6 py-20">
            <div className="text-center space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Transforme seu <span className="text-orange-300">Gabinete</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                A plataforma mais avançada para gestão política moderna
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Status da Assinatura Atual */}
          <div className="mb-12">
            <SubscriptionStatus />
          </div>

          {/* Toggle de Cobrança */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center bg-white rounded-2xl p-2 gap-2 border shadow-sm">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  "px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                  billingCycle === 'monthly' 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  "px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative",
                  billingCycle === 'yearly' 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Anual
                <Badge 
                  className="absolute -top-3 -right-3 text-xs font-bold shadow-lg bg-orange-500 text-white border-0"
                >
                  -20%
                </Badge>
              </button>
            </div>
          </div>

          {/* Grid de Planos */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlan === plan.name;
              const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
              const priceId = billingCycle === 'monthly' ? plan.priceIdMonthly : plan.priceIdYearly;
              
              const savings = plan.yearlyPrice && billingCycle === 'yearly' 
                ? calculateSavings(plan.monthlyPrice, plan.yearlyPrice)
                : 0;

              return (
                <Card 
                  key={plan.id}
                  className={cn(
                    "relative overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl border-0 bg-white/95 backdrop-blur-lg min-h-[600px]",
                    plan.popular && "ring-4 ring-orange-400 shadow-2xl scale-110 z-10",
                    isCurrentPlan && "ring-4 ring-blue-500"
                  )}
                >
                  {/* Background Gradient */}
                  <div 
                    className={cn("absolute inset-0 opacity-5 bg-gradient-to-br", plan.color)}
                  />

                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="font-bold shadow-lg border-0 bg-orange-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        MAIS POPULAR
                      </Badge>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-blue-500 text-white font-bold border-0 shadow-lg">
                        <Check className="h-3 w-3 mr-1" />
                        PLANO ATUAL
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className={cn("w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-r", plan.color)}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                        <CardDescription className="text-sm">{plan.description}</CardDescription>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">
                          {formatPrice(price)}
                        </span>
                        <span className="text-gray-600">
                          /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                        </span>
                      </div>
                      
                      {savings > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-0">
                            Economize {formatPrice(savings)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="relative z-10 flex-1 flex flex-col">
                    {/* Features */}
                    <div className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    {priceId ? (
                      <CheckoutButton
                        priceId={priceId}
                        plan={plan.id}
                        planName={plan.name}
                        className={cn(
                          "w-full font-semibold transition-all duration-300 border-0",
                          isCurrentPlan 
                            ? "bg-gray-100 text-gray-600 cursor-default hover:bg-gray-100"
                            : `bg-gradient-to-r ${plan.color} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
                        )}
                      >
                        {isCurrentPlan ? 'Plano Atual' : `Assinar ${plan.name}`}
                      </CheckoutButton>
                    ) : (
                      <div className="w-full py-3 px-4 text-center text-gray-500 bg-gray-100 rounded-lg">
                        Entre em Contato
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQ ou informações adicionais */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Precisa de Ajuda?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Nossa equipe está pronta para ajudar você a escolher o melhor plano
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:contato@legisfy.com" 
                className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                📧 contato@legisfy.com
              </a>
              <a 
                href="https://wa.me/5511999999999" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📱 WhatsApp Suporte
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}