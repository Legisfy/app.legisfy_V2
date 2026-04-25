import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Facebook, 
  Instagram, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Share2, 
  Heart, 
  Eye, 
  Calendar,
  MoreHorizontal,
  ThumbsUp,
  BarChart3,
  Thermometer,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Lock,
  ArrowRight,
  Globe
} from "lucide-react";
import { useGabineteData } from "@/hooks/useGabineteData";
import { StatsCard } from "@/components/ui/standard-card";

const followersData = [
  { name: 'Jan', followers: 45000, reach: 120000 },
  { name: 'Fev', followers: 48000, reach: 135000 },
  { name: 'Mar', followers: 52000, reach: 158000 },
  { name: 'Abr', followers: 58000, reach: 182000 },
  { name: 'Mai', followers: 65000, reach: 210000 },
  { name: 'Jun', followers: 72000, reach: 250000 },
];

const sentimentData = [
  { name: 'Positivo', value: 65, color: '#10b981' },
  { name: 'Neutro', value: 25, color: '#94a3b8' },
  { name: 'Negativo', value: 10, color: '#ef4444' },
];

const engagementByType = [
  { type: 'Vídeo', engagement: 4.8 },
  { type: 'Imagem', engagement: 3.2 },
  { type: 'Carrossel', engagement: 5.5 },
  { type: 'Reels', engagement: 7.2 },
];

const recentPosts = [
  {
    id: 1,
    platform: 'instagram',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&q=80',
    content: 'Hoje visitamos a comunidade de São José para ouvir as demandas locais...',
    date: '2 horas atrás',
    likes: '1.2k',
    comments: 84
  },
  {
    id: 2,
    platform: 'facebook',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&q=80',
    content: 'Aprovamos o novo projeto de lei que incentiva o esporte nas escolas públicas!',
    date: '5 horas atrás',
    likes: 842,
    comments: 156
  }
];

export default function RedesSociais() {
  const { gabinete } = useGabineteData();
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkConnections = async () => {
      if (!gabinete?.id) return;
      
      try {
        const { data: connectionData } = await supabase
          .from('ia_integrations' as any)
          .select('facebook_enabled, instagram_enabled')
          .eq('gabinete_id', gabinete.id)
          .maybeSingle();
        
        const data = connectionData as any;
        
        if (data && (data.facebook_enabled || data.instagram_enabled)) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error("Erro ao verificar conexões:", error);
      } finally {
        setLoading(false);
      }
    };

    if (gabinete) {
      checkConnections();
    }

    // Verificar se retornamos de um OAuth com sucesso
    const params = new URLSearchParams(window.location.search);
    if (params.get('meta') === 'success') {
      toast.success("Redes sociais conectadas com sucesso!");
      // Limpar o parâmetro da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [gabinete?.id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando Métricas...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isConnected) {
    return (
      <AppLayout>
        <div className="p-6 h-[85vh] flex items-center justify-center">
          <Card className="max-w-2xl w-full border-border/40 bg-card/40 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-1000" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-1000" />
            
            <CardContent className="pt-12 pb-12 px-8 flex flex-col items-center text-center space-y-8 relative z-10">
              <div className="relative">
                <div className="h-24 w-24 bg-zinc-900 rounded-3xl flex items-center justify-center border border-white/5 shadow-2xl relative z-10">
                  <Globe className="h-10 w-10 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 bg-zinc-900 rounded-full flex items-center justify-center border border-white/5 shadow-lg animate-bounce">
                  <Lock className="h-3 w-3 text-amber-500" />
                </div>
              </div>

              <div className="space-y-3">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest px-3 py-1">
                  Integração Necessária
                </Badge>
                <h2 className="text-3xl font-black font-outfit tracking-tighter text-white">
                  Conecte suas <span className="text-primary italic">Redes Sociais</span>
                </h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                  Para visualizar métricas, crescimento e análise de sentimento, você precisa vincular sua conta do Facebook ou Instagram.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col items-center gap-2">
                  <Facebook className="h-5 w-5 text-blue-500" />
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Facebook</span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col items-center gap-2">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  <span className="text-[10px] font-bold uppercase text-zinc-400">Instagram</span>
                </div>
              </div>

              <Button 
                size="lg" 
                onClick={() => navigate('/configuracoes')}
                className="w-full max-w-xs h-12 shadow-xl shadow-primary/20 font-black uppercase text-xs tracking-[0.1em] group"
              >
                Ir para Configurações
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>

              <p className="text-[10px] text-muted-foreground/40 font-medium">
                Sua segurança é nossa prioridade. Utilizamos a API oficial da Meta.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/30 p-6 rounded-2xl border border-border/40 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-primary/20 p-1 bg-background shadow-xl">
                <AvatarImage src={gabinete?.logomarca_url} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                  {gabinete?.politician_name?.substring(0, 2).toUpperCase() || "PL"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white ring-2 ring-background">
                  <Instagram className="w-3 h-3" />
                </div>
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white ring-2 ring-background">
                  <Facebook className="w-3 h-3" />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black uppercase tracking-tight font-outfit leading-none">
                  {gabinete?.politician_name || "Parlamentar"}
                </h1>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] font-black uppercase tracking-widest px-2">Verificado</Badge>
              </div>
              <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-emerald-500" /> Monitoramento em Tempo Real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-xl border border-border/10">
            {['7d', '15d', '30d', '90d'].map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                onClick={() => setPeriod(p)}
                className={`h-8 px-4 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  period === p ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground/50'
                }`}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Total de Seguidores"
            value="128.4k"
            change="+4.2%"
            icon={Users}
            iconBgColor="bg-blue-500"
          />
          <StatsCard 
            title="Alcance Total"
            value="842.1k"
            change="+12.5%"
            icon={Eye}
            iconBgColor="bg-purple-500"
          />
          <StatsCard 
            title="Taxa de Engajamento"
            value="5.82%"
            change="+0.4%"
            icon={TrendingUp}
            iconBgColor="bg-emerald-500"
          />
          <StatsCard 
            title="Menções"
            value="2.4k"
            change="-2.1%"
            icon={MessageSquare}
            iconBgColor="bg-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Growth Chart */}
          <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur shadow-none h-full overflow-hidden flex flex-col">
            <CardHeader className="pb-2 border-b border-border/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 flex items-center gap-2">
                    <BarChart3 className="w-3 h-3" /> Crescimento da Audiência
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-bold text-muted-foreground">Instagram</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500 opacity-40" />
                    <span className="text-[8px] font-bold text-muted-foreground">Facebook</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={followersData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                      tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="followers" 
                      stroke="#10b981" 
                      strokeWidth={4} 
                      dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="reach" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      opacity={0.3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Sentiment Thermometer */}
          <Card className="border-border/40 bg-card/40 backdrop-blur shadow-none h-full flex flex-col">
            <CardHeader className="pb-2 border-b border-border/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 flex items-center gap-2">
                <Thermometer className="w-3 h-3" /> Termômetro de Sentimento
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-transparent to-muted/5">
              <div className="h-[180px] w-full relative mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '10px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-center">
                  <h3 className="text-3xl font-black font-outfit text-emerald-500">65%</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Satisfação Geral</p>
                </div>
              </div>

              <div className="w-full space-y-3 pt-6">
                {sentimentData.map((s) => (
                  <div key={s.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{s.name}</span>
                      <span className="text-[10px] font-black">{s.value}%</span>
                    </div>
                    <Progress value={s.value} className="h-1.5" indicatorClassName={`bg-[${s.color}]`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="instagram" className="w-full">
          <TabsList className="bg-muted/10 p-1 border border-border/10 mb-6">
            <TabsTrigger value="instagram" className="gap-2 px-6 font-bold uppercase text-[10px] tracking-widest">
              <Instagram className="w-3 h-3 text-pink-500" /> Instagram
            </TabsTrigger>
            <TabsTrigger value="facebook" className="gap-2 px-6 font-bold uppercase text-[10px] tracking-widest">
              <Facebook className="w-3 h-3 text-blue-500" /> Facebook
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="instagram" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Seguidores', val: '72.4k', icon: Users, color: 'text-pink-500' },
                { label: 'Curtidas', val: '45.2k', icon: Heart, color: 'text-red-500' },
                { label: 'Comentários', val: '3.1k', icon: MessageSquare, color: 'text-blue-500' },
                { label: 'Alcance', val: '125.8k', icon: Share2, color: 'text-emerald-500' },
              ].map((m) => (
                <Card key={m.label} className="border-border/20 bg-card/30 shadow-none hover:bg-card/50 transition-all group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40 mb-1">{m.label}</p>
                      <h4 className="text-xl font-black font-outfit">{m.val}</h4>
                    </div>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center opacity-20 group-hover:scale-110 transition-transform", m.color.replace('text', 'bg'))}>
                      <m.icon className={cn("w-5 h-5", m.color)} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card className="border-border/40 bg-card/40 backdrop-blur shadow-none">
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Posts Mais Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recentPosts.map((post) => (
                        <Card key={post.id} className="border-border/20 bg-muted/5 overflow-hidden group hover:bg-muted/10 transition-all">
                          <div className="aspect-video overflow-hidden relative">
                            <img src={post.image} alt="Post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                              <div className="flex items-center gap-1.5 text-white">
                                <Heart className="w-5 h-5 fill-white" />
                                <span className="font-bold">{post.likes}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-white">
                                <MessageSquare className="w-5 h-5 fill-white" />
                                <span className="font-bold">{post.comments}</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-[11px] font-medium leading-relaxed line-clamp-2 mb-3 text-foreground/80">{post.content}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-muted-foreground lowercase">{post.date}</span>
                              <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black uppercase tracking-widest text-primary">Ver Insights</Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/40 bg-card/40 backdrop-blur shadow-none">
                <CardHeader>
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Filtro por Tipo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {engagementByType.map((item) => (
                    <div key={item.type} className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                        <span className="opacity-60">{item.type}</span>
                        <span className="text-primary">{item.engagement}% Eng.</span>
                      </div>
                      <Progress value={item.engagement * 10} className="h-1" />
                    </div>
                  ))}
                  <div className="pt-4 border-t border-border/10">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                      <p className="text-[10px] font-bold text-primary flex items-center gap-2 mb-2">
                        <Lightbulb className="w-3 h-3" /> Dica da IA
                      </p>
                      <p className="text-[9px] font-medium leading-relaxed opacity-70">
                        Seus vídeos estão performando 40% melhor que imagens estáticas. Foque em Reels curtos com legendas dinâmicas.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
