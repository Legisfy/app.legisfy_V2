import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, User, Mail, Eye, EyeOff, Upload, Phone, Shield, ArrowLeft, ArrowRight, AlertCircle, Building2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import SplineRobot from '@/components/auth/SplineRobot';
import RobotOverlay from '@/components/auth/RobotOverlay';

interface InvitationData {
  id: string;
  email: string;
  name: string;
  role: 'assessor' | 'chefe';
  gabinete_id: string;
  gabinete_nome?: string;
  instituicao_nome?: string;
  accepted_at?: string;
  expires_at?: string;
}

interface AssessorFormData {
  email: string;
  password: string;
  fullName: string;
  birthDate: string;
  whatsapp: string;
  sex: string;
  profilePhoto: File | null;
}

export default function AceitarConviteEquipe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [formData, setFormData] = useState<AssessorFormData>({
    email: '',
    password: '',
    fullName: '',
    birthDate: '',
    whatsapp: '',
    sex: '',
    profilePhoto: null
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token de convite não encontrado na URL');
      setLoading(false);
      return;
    }
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const { data: invitationData, error: invitationError } = await supabase
        .rpc('get_invitation_details', { invitation_token: token })
        .maybeSingle();

      if (invitationError) {
        setError('Erro ao buscar convite. Tente novamente.');
        return;
      }
      if (!invitationData) {
        setError('Convite inválido ou expirado.');
        return;
      }
      if (invitationData.accepted_at) {
        setError('Convite já aceito.');
        return;
      }
      if (invitationData.expires_at && new Date(invitationData.expires_at) < new Date()) {
        setError('Convite inválido ou expirado.');
        return;
      }

      const finalInvitation: InvitationData = {
        id: invitationData.id,
        email: invitationData.email,
        name: invitationData.name || '',
        role: invitationData.role as 'assessor' | 'chefe',
        gabinete_id: invitationData.gabinete_id,
        gabinete_nome: invitationData.gabinete_nome || 'Gabinete',
        instituicao_nome: invitationData.instituicao_nome || 'Instituição',
        accepted_at: invitationData.accepted_at,
        expires_at: invitationData.expires_at
      };

      setInvitation(finalInvitation);
      setFormData(prev => ({ ...prev, email: invitationData.email, fullName: invitationData.name || '' }));
      setLoginData(prev => ({ ...prev, email: invitationData.email }));
    } catch (err) {
      setError('Erro ao validar convite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const maskDate = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{4})\d+?$/, '$1');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePhoto: file }));
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    try {
      setProcessing(true);
      setError(null);

      if (formData.email.toLowerCase() !== invitation.email.toLowerCase()) {
        setError('E-mail do formulário não corresponde ao do convite.');
        return;
      }
      if (formData.password.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (!formData.fullName.trim()) {
        setError('Nome completo é obrigatório.');
        return;
      }
      if (!formData.whatsapp.trim()) {
        setError('WhatsApp é obrigatório.');
        return;
      }
      if (!formData.sex) {
        setError('Gênero é obrigatório.');
        return;
      }
      if (!formData.birthDate) {
        setError('Data de nascimento é obrigatória.');
        return;
      }

      // Converter DD/MM/AAAA para AAAA-MM-DD
      let isoBirthDate = formData.birthDate;
      if (formData.birthDate.includes('/')) {
        const [day, month, year] = formData.birthDate.split('/');
        isoBirthDate = `${year}-${month}-${day}`;
      }

      let avatarBase64 = null;
      if (formData.profilePhoto) {
        const reader = new FileReader();
        avatarBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(formData.profilePhoto!);
        });
      }

      const { data, error } = await supabase.functions.invoke('accept-invite-and-create-assessor', {
        body: {
          token,
          password: formData.password,
          full_name: formData.fullName,
          birthdate: isoBirthDate,
          phone_whatsapp: formData.whatsapp.replace(/\D/g, ''),
          sex: formData.sex,
          avatar_base64_or_path: avatarBase64
        }
      });

      if (error) throw error;

      if (data.ok) {
        setSuccess(true);
        toast.success('Sucesso!', {
          description: `Conta criada e convite aceito no gabinete ${data.gabinete_nome}. Faça login para continuar.`
        });
        setRedirecting(true);
        setTimeout(() => { window.location.href = '/auth'; }, 1200);
      } else {
        throw new Error(data.error || 'Erro ao processar convite');
      }
    } catch (err: any) {
      if (err.message?.includes('corresponds')) {
        setError('E-mail do formulário não corresponde ao do convite.');
      } else if (err.message?.includes('already exists')) {
        setError('Este e-mail já está cadastrado. Use "Já tenho conta".');
      } else {
        setError('Falha ao criar conta. Tente novamente.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    try {
      setProcessing(true);
      setError(null);

      const { error: loginError } = await signIn(loginData.email, loginData.password);
      if (loginError) {
        setError('Email ou senha incorretos. Tente novamente.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('accept-invite-and-create-assessor', {
        body: {
          token,
          password: '',
          full_name: invitation.name,
          birthdate: '',
          phone_whatsapp: '',
          sex: ''
        }
      });

      if (error) throw error;

      if (data.ok) {
        setSuccess(true);
        toast.success('Sucesso!', { description: `Convite aceito! Bem-vindo ao gabinete ${data.gabinete_nome}!` });
        setRedirecting(true);
        setTimeout(() => { window.location.href = data.redirect || '/'; }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const roleLabel = invitation?.role === 'chefe' ? 'Chefe de Gabinete' : 'Assessor';

  // ─── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black text-white flex items-center justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />
        <div className="relative z-10 text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-white/60" />
          <p className="text-white/30 text-sm">Validando convite...</p>
        </div>
      </div>
    );
  }

  // ─── Error (no invitation) ──────────────────────────────────
  if (error && !invitation) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black text-white flex items-center justify-center p-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />
        <div className="relative z-10 w-full max-w-md">
          <div className="absolute -inset-4 bg-white/[0.03] rounded-[2.5rem] blur-3xl pointer-events-none" />
          <Card className="relative bg-[#09090b]/95 border border-white/[0.05] rounded-2xl shadow-2xl">
            <CardContent className="p-8 text-center space-y-6">
              <img
                src="https://wvvxstgpjodmfxpekhkf.supabase.co/storage/v1/object/public/LEGISFY/legisfy%20branco.png"
                alt="Legisfy"
                className="h-16 mx-auto object-contain opacity-95"
              />
              <Alert variant="destructive" className="bg-red-950/20 border-red-500/20 text-red-400 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
              <Button
                onClick={() => navigate('/auth')}
                className="w-full h-11 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg"
              >
                Ir para Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Redirecting ──────────────────────────────────────────
  if (user || redirecting) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black text-white flex items-center justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />
        <div className="relative z-10 text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-white/60" />
          <p className="text-white/30 text-sm">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // ─── Main Page ──────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-white selection:bg-white/10 font-sans">
      {/* Background Metallic Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col md:flex-row items-center justify-center p-6 md:p-12 lg:gap-32">

        {/* Left Side — Robot */}
        <div className="hidden lg:flex flex-col items-center justify-center w-full max-w-2xl h-[600px] pointer-events-auto relative">
          {/* Texto de boas-vindas */}
          <div className="absolute top-0 left-0 right-0 z-40 text-left space-y-4 animate-in fade-in slide-in-from-left duration-1000">
            <h2 className="text-4xl font-black tracking-tighter text-white leading-tight">
              {showCreateForm ? (
                <>
                  Criando sua <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">conta...</span>
                </>
              ) : showLoginForm ? (
                <>
                  Bem-vindo <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">de volta!</span>
                </>
              ) : (
                <>
                  Você foi <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">convidado!</span>
                </>
              )}
            </h2>
            <p className="text-white/30 text-base font-medium max-w-[280px] leading-relaxed">
              {showCreateForm
                ? 'Preencha seus dados e comece a colaborar com a equipe.'
                : showLoginForm
                  ? 'Faça login para aceitar o convite e acessar o gabinete.'
                  : `Junte-se ao ${invitation?.gabinete_nome || 'gabinete'} como ${roleLabel}.`
              }
            </p>
          </div>

          {/* Robô */}
          <SplineRobot />
          <RobotOverlay mode="onboarding" />

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent z-30 pointer-events-none" />
        </div>

        {/* Onboarding Card */}
        <div className="relative group/card w-full max-w-[450px]">
          {/* Layered Metallic Glows */}
          <div className="absolute -inset-4 bg-white/[0.03] rounded-[2.5rem] blur-3xl pointer-events-none" />
          <div className="absolute -inset-1 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-2xl blur-md opacity-20 pointer-events-none" />

          <Card className="relative w-full bg-[#09090b]/95 border border-white/[0.05] rounded-2xl shadow-2xl overflow-hidden">
            {/* Logo */}
            <div className="pt-6 flex justify-center px-6 text-center">
              <img
                src="https://wvvxstgpjodmfxpekhkf.supabase.co/storage/v1/object/public/LEGISFY/legisfy%20branco.png"
                alt="Legisfy"
                className="h-20 w-auto object-contain opacity-95 transition-all hover:scale-105"
              />
            </div>

            <CardHeader className="space-y-2 px-8 py-4 pb-2">
              {/* Gabinete Banner */}
              {invitation && (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-1 text-center mb-2">
                  <div className="flex items-center justify-center gap-2 text-white/30 text-[10px] font-bold uppercase tracking-[0.15em]">
                    <Building2 size={12} />
                    <span>GABINETE</span>
                  </div>
                  <p className="text-white font-bold text-base tracking-tight">{invitation.gabinete_nome}</p>
                  <p className="text-white/40 text-xs">{invitation.instituicao_nome}</p>
                </div>
              )}

              <div className="space-y-1 text-center">
                <CardTitle className="text-xl font-bold tracking-tight text-white">
                  {showCreateForm ? 'Criar Conta' : showLoginForm ? 'Fazer Login' : `Convite para ${roleLabel}`}
                </CardTitle>
                <CardDescription className="text-[12px] text-white/30">
                  {showCreateForm
                    ? 'Preencha seus dados para criar sua conta.'
                    : showLoginForm
                      ? 'Entre com suas credenciais para aceitar.'
                      : 'Escolha como deseja aceitar o convite.'
                  }
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-8 py-4 pt-2 space-y-4">
              {/* Error */}
              {error && (
                <Alert variant="destructive" className="bg-red-950/20 border-red-500/20 text-red-400 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              {/* Success */}
              {success && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-emerald-300 text-xs">Conta criada com sucesso! Redirecionando...</p>
                </div>
              )}

              {/* ─── Initial: Invite Details + Buttons ─── */}
              {invitation && !success && !showCreateForm && !showLoginForm && (
                <div className="space-y-4">
                  {/* Invite Details */}
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">Detalhes</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/30 flex items-center gap-2"><User size={14} /> Nome</span>
                        <span className="text-white/70 font-medium">{invitation.name || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/30 flex items-center gap-2"><Mail size={14} /> Email</span>
                        <span className="text-white/70 font-medium">{invitation.email}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/30 flex items-center gap-2"><Shield size={14} /> Cargo</span>
                        <span className="text-white/70 font-medium">{roleLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full h-11 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-2 group"
                    disabled={processing}
                  >
                    Criar Conta e Aceitar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <Button
                    onClick={() => setShowLoginForm(true)}
                    variant="outline"
                    className="w-full h-11 border-white/5 bg-transparent hover:bg-white/5 text-white rounded-lg flex items-center justify-center gap-2"
                    disabled={processing}
                  >
                    <User size={16} />
                    Já tenho conta — Fazer Login
                  </Button>
                </div>
              )}

              {/* ─── Create Account Form ─── */}
              {showCreateForm && !success && (
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  {/* Photo Upload */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border border-white/10">
                      <AvatarImage src={formData.profilePhoto ? URL.createObjectURL(formData.profilePhoto) : undefined} />
                      <AvatarFallback className="bg-white/[0.03] text-white/30">
                        <User className="h-7 w-7" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Input id="profilePhoto" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('profilePhoto')?.click()}
                        className="w-full border-white/5 bg-transparent hover:bg-white/5 text-white/40 hover:text-white rounded-lg h-9 text-xs"
                      >
                        <Upload className="h-3.5 w-3.5 mr-2" />
                        {formData.profilePhoto ? 'Alterar foto' : 'Foto de perfil (opcional)'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-8 space-y-1.5">
                      <Label className="text-[11px] font-medium text-white/40 ml-1">Nome Completo</Label>
                      <Input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        required
                        placeholder="Seu nome"
                        className="h-10 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 transition-all text-white"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1.5">
                      <Label className="text-[11px] font-medium text-white/40 ml-1">Nascimento</Label>
                      <Input
                        placeholder="DD/MM/AAAA"
                        value={formData.birthDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, birthDate: maskDate(e.target.value) }))}
                        required
                        className="h-10 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 transition-all text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4 space-y-1.5">
                      <Label className="text-[11px] font-medium text-white/40 ml-1">WhatsApp</Label>
                      <Input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: maskPhone(e.target.value) }))}
                        required
                        placeholder="(00) 00000-0000"
                        className="h-10 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 transition-all text-white"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1.5">
                      <Label className="text-[11px] font-medium text-white/40 ml-1">Gênero</Label>
                      <Select value={formData.sex} onValueChange={(val) => setFormData(prev => ({ ...prev, sex: val }))}>
                        <SelectTrigger className="h-10 bg-black border-white/5 rounded-lg text-white hover:bg-black/90 transition-all focus:ring-0 focus:ring-offset-0 focus:border-white/20">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-black dark:bg-black border-white/5 text-white !bg-black">
                          <SelectItem value="masculino" className="cursor-pointer focus:bg-white/10 focus:text-white">Masculino</SelectItem>
                          <SelectItem value="feminino" className="cursor-pointer focus:bg-white/10 focus:text-white">Feminino</SelectItem>
                          <SelectItem value="nao_binario" className="cursor-pointer focus:bg-white/10 focus:text-white">Não Binário</SelectItem>
                          <SelectItem value="outro" className="cursor-pointer focus:bg-white/10 focus:text-white">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-4 space-y-1.5">
                      <Label className="text-[11px] font-medium text-white/40 ml-1">Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        disabled
                        className="h-10 bg-white/[0.02] border-white/5 rounded-lg text-white/40 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-white/40 ml-1">Senha</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        placeholder="Mínimo 6 caracteres"
                        className="h-11 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 transition-all text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 h-11 border-white/5 bg-transparent hover:bg-white/5 text-white rounded-lg flex items-center justify-center gap-2"
                      disabled={processing}
                    >
                      <ArrowLeft size={18} /> Voltar
                    </Button>
                    <Button
                      type="submit"
                      disabled={processing || !formData.fullName || !formData.password || !formData.whatsapp || !formData.sex || !formData.birthDate}
                      className="flex-[2] h-11 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg shadow-xl shadow-white/5 transition-all flex items-center justify-center gap-2 group"
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>Criar Conta <CheckCircle size={18} className="group-hover:scale-110 transition-transform" /></>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* ─── Login Form ─── */}
              {showLoginForm && !success && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-white/40 ml-1">Email</Label>
                    <Input
                      type="email"
                      value={loginData.email}
                      disabled
                      className="h-11 bg-white/[0.02] border-white/5 rounded-lg text-white/40 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-white/40 ml-1">Senha</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        placeholder="Sua senha"
                        className="h-11 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 transition-all text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowLoginForm(false)}
                      className="flex-1 h-11 border-white/5 bg-transparent hover:bg-white/5 text-white rounded-lg flex items-center justify-center gap-2"
                      disabled={processing}
                    >
                      <ArrowLeft size={18} /> Voltar
                    </Button>
                    <Button
                      type="submit"
                      disabled={processing || !loginData.email || !loginData.password}
                      className="flex-[2] h-11 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg shadow-xl shadow-white/5 transition-all flex items-center justify-center gap-2 group"
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>Login e Aceitar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}