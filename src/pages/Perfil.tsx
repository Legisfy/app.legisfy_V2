import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { StandardCard } from "@/components/ui/standard-card";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Trophy,
  Target,
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  Lightbulb,
  Edit3,
  Save,
  X,
  Award,
  Star,
  Medal,
  Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";
import { useIdeiasStats } from "@/hooks/useIdeiasStats";
import { useMetasPremiacoes } from "@/hooks/useMetasPremiacoes";
import { SecureChangePasswordModal } from "@/components/modals/SecureChangePasswordModal";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  main_role: string;
  whatsapp?: string;
  created_at: string;
}

interface UserStats {
  eleitores: number;
  demandas: number;
  ideias: number;
  indicacoes: number;
  ranking: number;
  pontos: number;
}

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned_at: string;
}

const Perfil = () => {
  const { activeInstitution } = useActiveInstitution();
  const { pontuacoes } = useMetasPremiacoes();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    eleitores: 0,
    demandas: 0,
    ideias: 0,
    indicacoes: 0,
    ranking: 0,
    pontos: 0
  });
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    whatsapp: ''
  });
  const [loading, setLoading] = useState(true);
  const { stats: ideiasStats } = useIdeiasStats();
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  const categoryData = [
    { name: 'Eleitores', value: stats.eleitores, color: '#8884d8' },
    { name: 'Demandas', value: stats.demandas, color: '#82ca9d' },
    { name: 'Projetos de Lei', value: stats.ideias, color: '#ffc658' },
    { name: 'Indicações', value: stats.indicacoes, color: '#ff7300' }
  ];

  useEffect(() => {
    if (activeInstitution) {
      loadUserData();
    }
  }, [activeInstitution]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setEditForm({
          full_name: profileData.full_name || '',
          whatsapp: profileData.whatsapp || ''
        });
      }

      if (activeInstitution?.cabinet_id) {
        await Promise.all([
          loadUserStats(user.id, activeInstitution.cabinet_id),
          loadUserBadges(user.id, activeInstitution.cabinet_id),
          loadMonthlyEvolution(user.id, activeInstitution.cabinet_id)
        ]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserPoints = async (userId: string, cabinetId: string) => {
    try {
      // Get user activity counts
      const [eleitores, demandas, demandasResolvidas, ideias, ideiasAprovadas, indicacoes, indicacoesAtendidas] = await Promise.all([
        supabase.from('eleitores').select('id', { count: 'exact' }).eq('user_id', userId).eq('gabinete_id', cabinetId),
        supabase.from('demandas').select('id', { count: 'exact' }).eq('user_id', userId).eq('gabinete_id', cabinetId),
        supabase.from('demandas').select('id', { count: 'exact' }).eq('user_id', userId).eq('gabinete_id', cabinetId).eq('status', 'resolvida'),
        supabase.from('ideias').select('id', { count: 'exact' }).eq('user_id', userId).eq('gabinete_id', cabinetId),
        supabase.from('ideias').select('id', { count: 'exact' }).eq('user_id', userId).eq('gabinete_id', cabinetId).eq('status', 'aprovada'),
        supabase.from('indicacoes').select('id', { count: 'exact' }).eq('user_id', userId).eq('gabinete_id', cabinetId),
        supabase.from('indicacoes').select('id', { count: 'exact' }).eq('user_id', userId).eq('gabinete_id', cabinetId).eq('status', 'atendida'),
      ]);

      // Calculate points based on cabinet configuration
      let totalPoints = 0;

      // Get points from the cabinet configuration or use defaults
      const getPontos = (acao: string, defaultValue: number) => {
        const config = pontuacoes.find(p => p.acao === acao);
        return config ? config.pontos : defaultValue;
      };

      totalPoints += (eleitores.count || 0) * getPontos('Eleitor cadastrado', 1);
      totalPoints += (demandas.count || 0) * getPontos('Demanda criada', 1);
      totalPoints += (demandasResolvidas.count || 0) * getPontos('Demanda atendida', 3);
      totalPoints += (ideias.count || 0) * getPontos('Ideia de projeto de lei', 1);
      totalPoints += (ideiasAprovadas.count || 0) * getPontos('Projeto de Lei formalizado', 2);
      totalPoints += (indicacoes.count || 0) * getPontos('Indicação criada', 1);
      totalPoints += (indicacoesAtendidas.count || 0) * getPontos('Indicação atendida', 3);

      return totalPoints;
    } catch (error) {
      console.error('Error calculating user points:', error);
      return 0;
    }
  };

  const loadUserStats = async (userId: string, cabinetId: string) => {
    try {
      const [eleitores, demandas, ideias, indicacoes, ranking] = await Promise.all([
        supabase.from('eleitores').select('id', { count: 'exact' }).eq('user_id', userId).eq('gabinete_id', cabinetId),
        supabase.from('demandas').select('id', { count: 'exact' }).eq('user_id', userId).eq('gabinete_id', cabinetId),
        supabase.from('ideias').select('id', { count: 'exact' }).eq('user_id', userId).eq('gabinete_id', cabinetId),
        supabase.from('indicacoes').select('id', { count: 'exact' }).eq('user_id', userId).eq('gabinete_id', cabinetId),
        supabase.from('rankings_mensais').select('posicao, pontos_total').eq('user_id', userId).eq('gabinete_id', cabinetId).maybeSingle()
      ]);

      // Calculate real points based on cabinet configuration
      const calculatedPoints = await calculateUserPoints(userId, cabinetId);

      setStats({
        eleitores: eleitores.count || 0,
        demandas: demandas.count || 0,
        ideias: ideias.count || 0,
        indicacoes: indicacoes.count || 0,
        ranking: ranking.data?.posicao || 0,
        pontos: calculatedPoints
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadUserBadges = async (userId: string, cabinetId: string) => {
    try {
      const { data } = await supabase
        .from('user_badges')
        .select(`
          earned_at,
          badges (
            id,
            name,
            description,
            icon,
            color
          )
        `)
        .eq('user_id', userId)
        .eq('gabinete_id', cabinetId);

      if (data) {
        const formattedBadges = data.map((item: any) => ({
          id: item.badges.id,
          name: item.badges.name,
          description: item.badges.description,
          icon: item.badges.icon,
          color: item.badges.color,
          earned_at: item.earned_at
        }));
        setBadges(formattedBadges);
      }
    } catch (error) {
      console.error('Error loading user badges:', error);
    }
  };

  const loadMonthlyEvolution = async (userId: string, cabinetId: string) => {
    try {
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const now = new Date();
      const data = [];

      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startOfMonth = targetDate.toISOString();
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const [eleitores, demandas, indicacoes] = await Promise.all([
          supabase.from('eleitores').select('id', { count: 'exact', head: true })
            .eq('user_id', userId).eq('gabinete_id', cabinetId)
            .gte('created_at', startOfMonth).lte('created_at', endOfMonth),
          supabase.from('demandas').select('id', { count: 'exact', head: true })
            .eq('user_id', userId).eq('gabinete_id', cabinetId)
            .gte('created_at', startOfMonth).lte('created_at', endOfMonth),
          supabase.from('indicacoes').select('id', { count: 'exact', head: true })
            .eq('user_id', userId).eq('gabinete_id', cabinetId)
            .gte('created_at', startOfMonth).lte('created_at', endOfMonth),
        ]);

        data.push({
          name: monthNames[targetDate.getMonth()],
          eleitores: eleitores.count || 0,
          demandas: demandas.count || 0,
          indicacoes: indicacoes.count || 0
        });
      }

      setMonthlyData(data);
    } catch (error) {
      console.error('Error loading monthly evolution:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          whatsapp: editForm.whatsapp
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        full_name: editForm.full_name,
        whatsapp: editForm.whatsapp
      } : null);

      setIsEditing(false);
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive"
      });
    }
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getRoleDisplayName = () => {
    switch (profile?.main_role) {
      case 'admin_plataforma': return 'Administrador';
      case 'politico': return 'Político';
      case 'chefe_gabinete': return 'Chefe de Gabinete';
      default: return 'Assessor';
    }
  };

  const getRankingColor = (ranking: number) => {
    if (ranking === 1) return 'text-yellow-600';
    if (ranking === 2) return 'text-gray-500';
    if (ranking === 3) return 'text-orange-600';
    return 'text-blue-600';
  };

  const getRankingIcon = (ranking: number) => {
    if (ranking === 1) return Medal;
    if (ranking === 2) return Award;
    if (ranking === 3) return Star;
    return Trophy;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando perfil...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil Completo</h1>
          <p className="text-muted-foreground">
            Visualize todas suas informações pessoais e acompanhe seu desempenho completo
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="perfil">Editar Perfil</TabsTrigger>
            <TabsTrigger value="premiacoes">Premiações</TabsTrigger>
            <TabsTrigger value="atividades">Atividades</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StandardCard
                title="Total Eleitores"
                description="Eleitores cadastrados"
                value={stats.eleitores.toString()}
                icon={Users}
                iconColor="text-blue-600"
                iconBgColor="bg-blue-500/10"
                borderColor="hsl(var(--info))"
              />

              <StandardCard
                title="Demandas"
                description="Total de demandas"
                value={stats.demandas.toString()}
                icon={MessageSquare}
                iconColor="text-green-600"
                iconBgColor="bg-green-500/10"
                borderColor="hsl(var(--success))"
              />

              <StandardCard
                title="Projetos de Lei"
                description="Total de projetos de lei"
                value={stats.ideias.toString()}
                icon={Lightbulb}
                iconColor="text-orange-600"
                iconBgColor="bg-orange-500/10"
                borderColor="hsl(var(--orange))"
              />

              <StandardCard
                title="Pontuação"
                description={stats.ranking > 0 ? `Posição #${stats.ranking}` : 'Baseado na configuração do gabinete'}
                value={stats.pontos.toString()}
                icon={Trophy}
                iconColor="text-purple-600"
                iconBgColor="bg-purple-500/10"
                borderColor="hsl(var(--violet))"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Evolução Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="eleitores" stroke="#8884d8" strokeWidth={2} name="Eleitores" />
                      <Line type="monotone" dataKey="demandas" stroke="#82ca9d" strokeWidth={2} name="Demandas" />
                      <Line type="monotone" dataKey="indicacoes" stroke="#ff7300" strokeWidth={2} name="Indicações" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Atividades</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Perfil Tab */}
          <TabsContent value="perfil" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                  {!isEditing ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowChangePasswordModal(true)}
                        className="gap-2"
                      >
                        <Lock className="h-4 w-4" />
                        Alterar Senha
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({
                            full_name: profile?.full_name || '',
                            whatsapp: profile?.whatsapp || ''
                          });
                        }}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveProfile}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Salvar
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <ProfilePhotoUpload
                      currentPhotoUrl={profile?.avatar_url || user?.user_metadata?.avatar_url}
                      userInitials={getUserInitials()}
                      onPhotoUpdate={(newPhotoUrl) => {
                        setProfile(prev => prev ? { ...prev, avatar_url: newPhotoUrl } : null);
                      }}
                    />
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold">{profile?.full_name}</h3>
                      <Badge variant="secondary">{getRoleDisplayName()}</Badge>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Membro desde {new Date(profile?.created_at || '').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome Completo</Label>
                      {isEditing ? (
                        <Input
                          id="full_name"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{profile?.full_name || 'Não informado'}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user?.email}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      {isEditing ? (
                        <Input
                          id="whatsapp"
                          value={editForm.whatsapp}
                          onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                          placeholder="(11) 99999-9999"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{profile?.whatsapp || 'Não informado'}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Gabinete</Label>
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{activeInstitution?.cabinet_name || 'Carregando...'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Resumo de Atividade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Eleitores</span>
                      </div>
                      <span className="font-semibold">{stats.eleitores}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Demandas</span>
                      </div>
                      <span className="font-semibold">{stats.demandas}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Projetos de Lei</span>
                      </div>
                      <span className="font-semibold">{stats.ideias}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Indicações</span>
                      </div>
                      <span className="font-semibold">{stats.indicacoes}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-center space-y-2">
                      <div className="text-center">
                        <span className="text-2xl font-bold text-primary">{stats.pontos}</span>
                        <p className="text-xs text-muted-foreground">pontos totais</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Calculado pela configuração do gabinete
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>



          {/* Premiações Tab */}
          <TabsContent value="premiacoes" className="space-y-6">
            {/* Pontuação Atual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Sua Pontuação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 border rounded-lg bg-primary/5">
                    <span className="text-3xl font-bold text-primary">{stats.pontos}</span>
                    <p className="text-xs text-muted-foreground mt-1">Pontos Totais</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <span className="text-3xl font-bold text-blue-600">{stats.eleitores}</span>
                    <p className="text-xs text-muted-foreground mt-1">Eleitores</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <span className="text-3xl font-bold text-green-600">{stats.demandas}</span>
                    <p className="text-xs text-muted-foreground mt-1">Demandas</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <span className="text-3xl font-bold text-orange-600">{stats.indicacoes}</span>
                    <p className="text-xs text-muted-foreground mt-1">Indicações</p>
                  </div>
                </div>
                {stats.ranking > 0 && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/30 flex items-center gap-3">
                    {(() => {
                      const Icon = getRankingIcon(stats.ranking);
                      return <Icon className={`h-8 w-8 ${getRankingColor(stats.ranking)}`} />;
                    })()}
                    <div>
                      <span className={`text-2xl font-bold ${getRankingColor(stats.ranking)}`}>#{stats.ranking}</span>
                      <p className="text-xs text-muted-foreground">Posição no ranking do gabinete</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metas do Gabinete */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Metas e Progresso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /> Eleitores</span>
                      <span className="font-semibold">{stats.eleitores}/50</span>
                    </div>
                    <Progress value={Math.min((stats.eleitores / 50) * 100, 100)} className="h-2.5" />
                    {stats.eleitores >= 50 && <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">✓ Meta batida!</Badge>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-green-500" /> Demandas</span>
                      <span className="font-semibold">{stats.demandas}/30</span>
                    </div>
                    <Progress value={Math.min((stats.demandas / 30) * 100, 100)} className="h-2.5" />
                    {stats.demandas >= 30 && <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">✓ Meta batida!</Badge>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-orange-500" /> Projetos de Lei</span>
                      <span className="font-semibold">{stats.ideias}/10</span>
                    </div>
                    <Progress value={Math.min((stats.ideias / 10) * 100, 100)} className="h-2.5" />
                    {stats.ideias >= 10 && <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">✓ Meta batida!</Badge>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-purple-500" /> Indicações</span>
                      <span className="font-semibold">{stats.indicacoes}/20</span>
                    </div>
                    <Progress value={Math.min((stats.indicacoes / 20) * 100, 100)} className="h-2.5" />
                    {stats.indicacoes >= 20 && <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">✓ Meta batida!</Badge>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Pontuação por Ação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pontuacoes.length > 0 ? (
                    pontuacoes.map((config, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium">{config.acao}</span>
                        <Badge variant="outline">{config.pontos} pts</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Award className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">Nenhuma configuração de pontuação definida</p>
                      <p className="text-xs text-muted-foreground mt-1">O chefe do gabinete pode configurar as pontuações</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Conquistas/Badges */}
            {badges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="h-5 w-5" />
                    Conquistas Desbloqueadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{badge.name}</h4>
                          <p className="text-sm text-muted-foreground">{badge.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Conquistado em {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Atividades Tab */}
          <TabsContent value="atividades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Pontuação do Gabinete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {pontuacoes.map((config, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">{config.acao}</span>
                      <Badge variant="outline">{config.pontos} pontos</Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Sua Pontuação Atual: {stats.pontos} pontos</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Esta pontuação é calculada automaticamente com base nas suas atividades e na
                    configuração de pontos definida pelo gabinete.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metas Mensais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Eleitores Cadastrados</span>
                    <span>{stats.eleitores}/50</span>
                  </div>
                  <Progress value={(stats.eleitores / 50) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Demandas</span>
                    <span>{stats.demandas}/30</span>
                  </div>
                  <Progress value={(stats.demandas / 30) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Projetos de Lei</span>
                    <span>{stats.ideias}/10</span>
                  </div>
                  <Progress value={(stats.ideias / 10) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Alteração de Senha */}
      <SecureChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </AppLayout>
  );
};

export default Perfil;