import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CityCombobox } from "@/components/onboarding/CityCombobox";
import { StateCombobox } from "@/components/onboarding/StateCombobox";
import { Loader2, User, Building2, MapPin, Search, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Upload, Phone, Globe, Briefcase, Eye, X, ImageIcon, MessageSquare, FileText, Users, Send, Calendar, UserCheck, Megaphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SplineRobot from "@/components/auth/SplineRobot";
import RobotOverlay from "@/components/auth/RobotOverlay";

const SaaSOnboarding = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Typewriter effect para step 4
    const typewriterWords = ['Inteligência', 'Poder', 'Estratégia', 'Ambição'];
    const [twWordIndex, setTwWordIndex] = useState(0);
    const [twCharIndex, setTwCharIndex] = useState(0);
    const [twIsDeleting, setTwIsDeleting] = useState(false);
    const twCurrentWord = typewriterWords[twWordIndex];
    const twDisplayText = twCurrentWord.slice(0, twCharIndex);

    // Data from DB
    const [estados, setEstados] = useState<any[]>([]);
    const [cidades, setCidades] = useState<any[]>([]);
    const [camaras, setCamaras] = useState<any[]>([]);
    const [partidos, setPartidos] = useState<any[]>([]);
    const [suggestedPoliticians, setSuggestedPoliticians] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        // Step 1: Personal
        nome_completo: '',
        email: '',
        senha: '',
        cpf: '',
        whatsapp: '',
        data_nascimento: '',
        genero: '',

        // Step 2: Location
        estado_id: '',
        cidade_id: '',


        // Step 3: Cabinet
        camara_id: '',
        nome_politico: '',
        partido_id: '',
        logomarca_url: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    // Atualizar nome_politico quando gênero mudar
    useEffect(() => {
        if (formData.genero) {
            // Só limpa se trocar de gênero (mantém o texto digitado)
            const prefixos = ['Vereador ', 'Vereadora ', 'Vereador(a) '];
            const currentValue = formData.nome_politico.trim();
            if (!currentValue || prefixos.some(p => currentValue === p.trim())) {
                setFormData(prev => ({ ...prev, nome_politico: '' }));
            }
        }
    }, [formData.genero]);

    // Typewriter animation
    useEffect(() => {
        if (currentStep !== 4) return;
        const word = typewriterWords[twWordIndex];
        let timer: NodeJS.Timeout;

        if (!twIsDeleting && twCharIndex < word.length) {
            // Digitando
            timer = setTimeout(() => setTwCharIndex(prev => prev + 1), 120);
        } else if (!twIsDeleting && twCharIndex === word.length) {
            // Pausa antes de apagar
            timer = setTimeout(() => setTwIsDeleting(true), 2000);
        } else if (twIsDeleting && twCharIndex > 0) {
            // Apagando
            timer = setTimeout(() => setTwCharIndex(prev => prev - 1), 80);
        } else if (twIsDeleting && twCharIndex === 0) {
            // Próxima palavra
            setTwIsDeleting(false);
            setTwWordIndex(prev => (prev + 1) % typewriterWords.length);
        }

        return () => clearTimeout(timer);
    }, [currentStep, twCharIndex, twIsDeleting, twWordIndex]);

    const getPrefixoGenero = (genero: string): string => {
        switch (genero) {
            case 'masculino': return 'Vereador';
            case 'feminino': return 'Vereadora';
            case 'nao_binario': return 'Vereador(a)';
            default: return '';
        }
    };

    const getTituloGenero = (genero: string): string => {
        switch (genero) {
            case 'masculino': return 'Vereador';
            case 'feminino': return 'Vereadora';
            case 'nao_binario': return 'Vereador(a)';
            default: return 'Vereador(a)';
        }
    };

    const loadInitialData = async () => {
        try {
            const { data: estadosData } = await supabase.from('estados').select('*').order('nome');
            const { data: camarasData } = await supabase.from('camaras').select('*, cidades(nome, estados(sigla))');
            const { data: partidosData } = await supabase.from('partidos_politicos').select('*').order('numero');

            setEstados(estadosData || []);
            setCamaras(camarasData || []);
            setPartidos(partidosData || []);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        }
    };

    const handleEstadoChange = async (estadoId: string) => {
        setFormData({ ...formData, estado_id: estadoId, cidade_id: '', camara_id: '' });
        const { data: cidadesData } = await supabase
            .from('cidades')
            .select('*')
            .eq('estado_id', estadoId)
            .order('nome');
        setCidades(cidadesData || []);
    };

    const maskCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
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

    const handleNextStep = async () => {
        if (currentStep === 1) {
            if (!formData.nome_completo || !formData.cpf || !formData.whatsapp || !formData.data_nascimento || !formData.genero) {
                setError('Por favor, preencha todos os dados pessoais.');
                return;
            }
            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (!dateRegex.test(formData.data_nascimento)) {
                setError('Formato de data inválido. Use DD/MM/AAAA');
                return;
            }

            setCurrentStep(2);
            setError('');
        } else if (currentStep === 2) {
            if (!formData.estado_id || !formData.cidade_id) {
                setError('Por favor, preencha os dados de localização.');
                return;
            }
            setSearching(true);
            setError('');
            setTimeout(() => {
                setSearching(false);
                setCurrentStep(3);
            }, 1000);
        } else if (currentStep === 3) {
            if (!formData.nome_politico || !formData.partido_id) {
                setError('Por favor, complete os dados do gabinete.');
                return;
            }
            setError('');
            setCurrentStep(4);
        }
    };

    const getNomeGabinete = () => {
        const prefixo = getPrefixoGenero(formData.genero);
        const nomeCompleto = prefixo ? `${prefixo} ${formData.nome_politico}`.trim() : formData.nome_politico;
        return `Gabinete do ${nomeCompleto || getTituloGenero(formData.genero)}`;
    };

    const getNomeCamara = () => {
        const cidade = cidades.find(c => c.id === formData.cidade_id);
        return cidade ? `Câmara Municipal de ${cidade.nome}` : 'Câmara Municipal';
    };

    const getPartidoSelecionado = () => {
        const partido = partidos.find(p => p.id === formData.partido_id);
        return partido ? `${partido.nome} (${partido.sigla})` : '';
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Armazenar o arquivo no state
        setLogoFile(file);

        // Gerar preview local imediato
        const reader = new FileReader();
        reader.onload = (ev) => {
            setLogoPreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
        toast({ title: "Logo carregada!", description: "Será enviada ao finalizar o cadastro." });
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
        setLogoFile(null);
        setFormData(prev => ({ ...prev, logomarca_url: '' }));
    };

    const handleFinalize = async () => {
        if (!formData.nome_politico || !formData.partido_id) {
            setError('Por favor, complete os dados do gabinete.');
            return;
        }

        setLoading(true);
        try {
            // 0. Criar conta via signUp
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.senha,
                options: {
                    data: {
                        full_name: formData.nome_completo,
                        gabinete_nome: getNomeGabinete(),
                        camara_nome: getNomeCamara()
                    }
                }
            });

            if (signUpError) {
                console.error('❌ Erro no signUp:', signUpError);
                // Se o usuário já existe, podemos tentar prosseguir para a criação do gabinete
                if (signUpError.message.includes('User already registered') || signUpError.status === 422) {
                    console.log('ℹ️ Usuário já registrado, tentando recuperar dados para finalizar gabinete...');
                    // Nota: No Supabase, se o usuário já existe, não conseguimos o ID dele via signUp por segurança
                    // mas podemos pedir para ele logar ou tentar um reset. 
                    // Para este fluxo ser fluido, o ideal é que o RPC fosse chamado primeiro ou o signUp fosse tolerante.
                }
                toast({ title: "Erro no cadastro", description: signUpError.message, variant: "destructive" });
                return;
            }

            const user = signUpData.user;
            if (!user) {
                toast({ title: "Erro", description: "Não foi possível criar a conta. Tente novamente.", variant: "destructive" });
                return;
            }

            // Convert DD/MM/YYYY to YYYY-MM-DD
            const [day, month, year] = formData.data_nascimento.split('/');
            const isoDate = `${year}-${month}-${day}`;

            // 0. Upload da logo (se houver)
            let logoUrl = formData.logomarca_url || null;
            if (logoFile) {
                try {
                    const fileExt = logoFile.name.split('.').pop();
                    const fileName = `logo_${Date.now()}.${fileExt}`;
                    const filePath = fileName; // No bucket 'gabinete-logos', salvaremos na raiz ou por ID se possível, mas como ainda não temos o ID do gabinete aqui (o RPC cria), guardamos apenas o nome.

                    const { error: uploadError } = await supabase.storage
                        .from('gabinete-logos')
                        .upload(filePath, logoFile);

                    if (uploadError) {
                        console.error('❌ Erro detalhado no upload da logo:', uploadError);
                        toast({
                            title: "Erro no upload da logomarca",
                            description: "O gabinete será criado, mas sem a logo. Você poderá editá-la depois.",
                            variant: "destructive"
                        });
                    } else {
                        console.log('✅ Logo enviada com sucesso para:', filePath);
                        const { data: { publicUrl } } = supabase.storage
                            .from('gabinete-logos')
                            .getPublicUrl(filePath);
                        logoUrl = publicUrl;
                        console.log('🔗 URL pública da logo:', logoUrl);
                    }
                } catch (err) {
                    console.error('💥 Exceção no upload da logo:', err);
                }
            }

            // 2. Chamar RPC para atualizar perfil e criar gabinete (evita erros de RLS e garante atomicidade)
            const { error: onboardingError } = await supabase.rpc('finalizar_onboarding', {
                p_user_id: user.id,
                p_full_name: formData.nome_completo,
                p_cpf: formData.cpf,
                p_whatsapp: formData.whatsapp,
                p_data_nascimento: isoDate,
                p_genero: formData.genero,
                p_estado_id: formData.estado_id || null,
                p_cidade_id: formData.cidade_id || null,
                p_camara_id: formData.camara_id || null,
                p_gabinete_nome: getNomeGabinete(),
                p_politician_name: `${getPrefixoGenero(formData.genero)} ${formData.nome_politico}`.trim(),
                p_partido_id: formData.partido_id || null,
                p_logo_url: logoUrl
            });

            if (onboardingError) {
                console.error('❌ Erro ao finalizar onboarding via RPC:', onboardingError);
                throw onboardingError;
            }

            // Deslogar e mostrar modal de sucesso
            await supabase.auth.signOut();
            setShowSuccessModal(true);
        } catch (err: any) {
            console.error('💥 Erro fatal no handleFinalize:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const stepIcons = [
        { icon: User, label: 'Dados' },
        { icon: MapPin, label: 'Local' },
        { icon: Building2, label: 'Gabinete' },
        { icon: Eye, label: 'Revisão' },
    ];

    return (
        <div className="min-h-screen relative overflow-hidden bg-black text-white selection:bg-white/10 font-sans">
            {/* Background Metallic Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />

            <div className="relative z-10 min-h-screen flex flex-col md:flex-row items-center justify-center p-6 md:p-12 lg:gap-32">

                {/* Left Side */}
                <div className="hidden lg:flex flex-col items-center justify-center w-full max-w-2xl h-[600px] pointer-events-auto relative">
                    {/* Texto de boas-vindas — só nos steps 1-3 */}
                    {currentStep < 4 && (
                        <div className="absolute top-0 left-0 right-0 z-40 text-left space-y-4 animate-in fade-in slide-in-from-left duration-1000">
                            <h2 className="text-4xl font-black tracking-tighter text-white leading-tight">
                                Criando seu <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">gabinete...</span>
                            </h2>
                            <p className="text-white/30 text-base font-medium max-w-[280px] leading-relaxed">
                                Configure seu ambiente <br />
                                de trabalho em poucos <br />
                                segundos e comece a <br />
                                transformar sua gestão.
                            </p>
                        </div>
                    )}

                    {/* Texto step 4 — ao lado do robô */}
                    {currentStep === 4 && (
                        <div className="absolute top-16 left-0 right-0 z-40 text-left space-y-3 animate-in fade-in slide-in-from-left duration-1000">
                            <h2 className="text-3xl font-black tracking-tighter text-white leading-tight">
                                Seu gabinete <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">está pronto!</span> 🚀
                            </h2>
                            <p className="text-white/30 text-sm font-medium max-w-[280px] leading-relaxed">
                                Aproveite todos nossos recursos <br />
                                poderosos e tenha um mandato de:
                            </p>
                            <div className="h-10 flex items-center">
                                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-400">
                                    {twDisplayText}
                                </span>
                                <span className="w-[3px] h-7 bg-white/60 ml-0.5 animate-pulse" />
                            </div>
                        </div>
                    )}

                    {/* Robô sempre visível */}
                    <SplineRobot />

                    {/* Cards flutuantes — só nos steps 1-3 */}
                    {currentStep < 4 && <RobotOverlay mode="onboarding" />}

                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent z-30 pointer-events-none" />

                    {/* Ícones orbitando o robô — step 4 */}
                    {currentStep === 4 && (
                        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none animate-in fade-in duration-1000">
                            {/* Keyframes para órbita */}
                            <style>{`
                                @keyframes orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                                @keyframes counter-orbit { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
                                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
                                @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 15px rgba(255,255,255,0.05); } 50% { box-shadow: 0 0 25px rgba(255,255,255,0.15); } }
                            `}</style>
                            {/* Container orbital */}
                            <div
                                className="relative"
                                style={{ width: '420px', height: '420px', animation: 'orbit 30s linear infinite' }}
                            >
                                {[
                                    { icon: MessageSquare, label: 'Demandas', angle: 0, color: 'from-blue-500/20 to-blue-600/5', iconColor: 'text-blue-400' },
                                    { icon: FileText, label: 'Indicações', angle: 51.4, color: 'from-purple-500/20 to-purple-600/5', iconColor: 'text-purple-400' },
                                    { icon: Users, label: 'Eleitores', angle: 102.8, color: 'from-emerald-500/20 to-emerald-600/5', iconColor: 'text-emerald-400' },
                                    { icon: Send, label: 'Disparos', angle: 154.3, color: 'from-orange-500/20 to-orange-600/5', iconColor: 'text-orange-400' },
                                    { icon: Calendar, label: 'Agendas', angle: 205.7, color: 'from-cyan-500/20 to-cyan-600/5', iconColor: 'text-cyan-400' },
                                    { icon: UserCheck, label: 'Assessores', angle: 257.1, color: 'from-pink-500/20 to-pink-600/5', iconColor: 'text-pink-400' },
                                    { icon: Megaphone, label: 'Marketing', angle: 308.5, color: 'from-amber-500/20 to-amber-600/5', iconColor: 'text-amber-400' },
                                ].map((item, i) => {
                                    const radius = 190;
                                    const rad = (item.angle * Math.PI) / 180;
                                    const x = Math.cos(rad) * radius;
                                    const y = Math.sin(rad) * radius;
                                    const Icon = item.icon;
                                    return (
                                        <div
                                            key={i}
                                            className="absolute flex flex-col items-center gap-1.5"
                                            style={{
                                                left: `calc(50% + ${x}px - 32px)`,
                                                top: `calc(50% + ${y}px - 32px)`,
                                                animation: 'counter-orbit 30s linear infinite',
                                            }}
                                        >
                                            <div
                                                className={`w-[52px] h-[52px] rounded-xl bg-gradient-to-br ${item.color} border border-white/[0.08] backdrop-blur-sm flex items-center justify-center`}
                                                style={{ animation: 'pulse-glow 3s ease-in-out infinite', animationDelay: `${i * 0.4}s` }}
                                            >
                                                <Icon size={22} className={item.iconColor} />
                                            </div>
                                            <span className="text-[10px] font-semibold text-white/70 whitespace-nowrap">{item.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Onboarding Card */}
                <div className="relative group/card w-full max-w-[450px]">
                    {/* Layered Metallic Glows */}
                    <div className="absolute -inset-4 bg-white/[0.03] rounded-[2.5rem] blur-3xl pointer-events-none" />
                    <div className="absolute -inset-1 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-2xl blur-md opacity-20 pointer-events-none" />

                    <Card className="relative w-full bg-[#09090b]/95 border border-white/[0.05] rounded-2xl shadow-2xl overflow-hidden">
                        <div className="pt-6 flex justify-center px-6 text-center">
                            <img
                                src="https://wvvxstgpjodmfxpekhkf.supabase.co/storage/v1/object/public/LEGISFY/legisfy%20branco.png"
                                alt="Legisfy"
                                className="h-20 w-auto object-contain opacity-95 transition-all hover:scale-105"
                            />
                        </div>
                        <CardHeader className="space-y-2 px-8 py-4 pb-2">
                            {/* Stepper com 4 etapas */}
                            <div className="flex items-center gap-2 mb-1 justify-center">
                                {stepIcons.map((step, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${currentStep === index + 1 ? 'bg-white text-black' : currentStep > index + 1 ? 'bg-white/20 text-white/60' : 'bg-white/10 text-white/40'}`}>
                                            <step.icon size={16} />
                                        </div>
                                        {index < stepIcons.length - 1 && (
                                            <div className={`h-[1px] w-3 ${currentStep > index + 1 ? 'bg-white/30' : 'bg-white/10'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-1 text-center">
                                <CardTitle className="text-xl font-bold tracking-tight text-white">
                                    {currentStep === 1 ? 'Seus Dados' : currentStep === 2 ? 'Localização' : currentStep === 3 ? 'Gabinete' : 'Revisão'}
                                </CardTitle>
                                <CardDescription className="text-[12px] text-white/30">
                                    {currentStep === 1
                                        ? 'Informações básicas para sua conta pessoal.'
                                        : currentStep === 2
                                            ? 'Onde você atua? Informe seu estado e cidade.'
                                            : currentStep === 3
                                                ? 'Vincule seu mandato ao sistema Legisfy.'
                                                : 'Confira os dados antes de finalizar.'}
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="px-8 py-4 pt-2 space-y-4">
                            {error && (
                                <Alert variant="destructive" className="bg-red-950/20 border-red-500/20 text-red-400 rounded-xl">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">{error}</AlertDescription>
                                </Alert>
                            )}

                            {currentStep === 1 ? (
                                /* STEP 1: PERSONAL DATA */
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                        <div className="md:col-span-8 space-y-1.5">
                                            <Label className="text-[11px] font-medium text-white/40 ml-1">Nome Completo</Label>
                                            <Input
                                                placeholder="Seu nome"
                                                value={formData.nome_completo}
                                                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                                                className="h-10 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 transition-all text-white"
                                            />
                                        </div>
                                        <div className="md:col-span-4 space-y-1.5">
                                            <Label className="text-[11px] font-medium text-white/40 ml-1">Data de Nascimento</Label>
                                            <Input
                                                placeholder="DD/MM/AAAA"
                                                value={formData.data_nascimento}
                                                onChange={(e) => setFormData({ ...formData, data_nascimento: maskDate(e.target.value) })}
                                                className="h-10 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 transition-all text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                        <div className="md:col-span-4 space-y-1.5">
                                            <Label className="text-[11px] font-medium text-white/40 ml-1">CPF</Label>
                                            <Input
                                                placeholder="000.000.000-00"
                                                value={formData.cpf}
                                                onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                                                className="h-10 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 transition-all text-white"
                                            />
                                        </div>
                                        <div className="md:col-span-4 space-y-1.5">
                                            <Label className="text-[11px] font-medium text-white/40 ml-1">WhatsApp</Label>
                                            <Input
                                                placeholder="(00) 00000-0000"
                                                value={formData.whatsapp}
                                                onChange={(e) => setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })}
                                                className="h-10 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 transition-all text-white"
                                            />
                                        </div>
                                        <div className="md:col-span-4 space-y-1.5">
                                            <Label className="text-[11px] font-medium text-white/40 ml-1">Gênero</Label>
                                            <Select value={formData.genero} onValueChange={(val) => setFormData({ ...formData, genero: val })}>
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
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-medium text-white/40 ml-1">E-mail Pessoal</Label>
                                        <Input
                                            placeholder="exemplo@email.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="h-11 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 transition-all text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-medium text-white/40 ml-1">Senha</Label>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Mínimo 6 caracteres"
                                                value={formData.senha}
                                                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                                className="h-11 bg-white/[0.02] border-white/5 rounded-lg focus:border-white/20 transition-all text-white pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleNextStep}
                                        className="w-full h-11 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg mt-4 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        Próximo passo <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            ) : currentStep === 2 ? (
                                /* STEP 2: ADDRESS / LOCATION */
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-medium text-white/40 ml-1">Estado (UF)</Label>
                                            <StateCombobox
                                                estados={estados}
                                                value={formData.estado_id}
                                                onChange={handleEstadoChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-medium text-white/40 ml-1">Cidade</Label>
                                            <CityCombobox
                                                cidades={cidades}
                                                value={formData.cidade_id}
                                                onChange={(val) => setFormData({ ...formData, cidade_id: val })}
                                                disabled={!formData.estado_id}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentStep(1)}
                                            className="flex-1 h-11 border-white/5 bg-transparent hover:bg-white/5 text-white rounded-lg flex items-center justify-center gap-2"
                                        >
                                            <ArrowLeft size={18} /> Voltar
                                        </Button>
                                        <Button
                                            onClick={handleNextStep}
                                            disabled={searching}
                                            className="flex-[2] h-11 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-2 group"
                                        >
                                            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Próximo <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                                        </Button>
                                    </div>
                                </div>
                            ) : currentStep === 3 ? (
                                /* STEP 3: CABINET DATA */
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-medium text-white/40 ml-1">Câmara Municipal (Identificada)</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-white/20" />
                                            <Input
                                                value={getNomeCamara()}
                                                readOnly
                                                className="h-11 pl-10 bg-white/[0.02] border-white/5 rounded-lg text-white/70 focus:border-white/5 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Upload de Logomarca - Retângulo com Preview */}
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-medium text-white/40 ml-1">Logomarca do Gabinete (Opcional)</Label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative w-full h-[120px] rounded-xl bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white/[0.04] hover:border-white/20 transition-all group"
                                        >
                                            {logoPreview || formData.logomarca_url ? (
                                                <>
                                                    <img
                                                        src={logoPreview || formData.logomarca_url}
                                                        alt="Preview da Logo"
                                                        className="w-full h-full object-contain p-3"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveLogo();
                                                        }}
                                                        className="absolute top-2 right-2 z-20 w-6 h-6 bg-black/60 hover:bg-red-500/80 rounded-full flex items-center justify-center transition-colors"
                                                    >
                                                        <X size={12} className="text-white" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-white/20 group-hover:text-white/40 transition-colors">
                                                    <ImageIcon size={28} />
                                                    <span className="text-[11px]">Clique para enviar a logomarca</span>
                                                    <span className="text-[10px] text-white/15">JPG, PNG — Recomendado: 400×120px</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <div className="md:col-span-8 space-y-2">
                                            <Label className="text-[11px] font-medium text-white/40 ml-1">Nome Político</Label>
                                            <div className="flex items-center h-11 bg-white/[0.02] border border-white/5 rounded-lg focus-within:border-white/20 transition-all overflow-hidden">
                                                <User className="ml-3 mr-2 h-4 w-4 text-white/20 flex-shrink-0" />
                                                {formData.genero && (
                                                    <span className="text-white font-medium text-sm whitespace-nowrap flex-shrink-0">
                                                        {getPrefixoGenero(formData.genero)}
                                                    </span>
                                                )}
                                                <input
                                                    placeholder="Nome Sobrenome"
                                                    value={formData.nome_politico}
                                                    onChange={(e) => setFormData({ ...formData, nome_politico: e.target.value })}
                                                    className="flex-1 h-full bg-transparent border-none outline-none text-white text-sm pl-1.5 placeholder:text-white/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-4 space-y-2">
                                            <Label className="text-[11px] font-medium text-white/40 ml-1">Partido</Label>
                                            <Select value={formData.partido_id} onValueChange={(val) => setFormData({ ...formData, partido_id: val })}>
                                                <SelectTrigger className="h-11 bg-white/[0.02] border-white/5 rounded-lg text-white hover:bg-white/5 transition-all">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-white/10 text-white backdrop-blur-xl max-h-[280px]">
                                                    {partidos.map(p => (
                                                        <SelectItem key={p.id} value={p.id} className="cursor-pointer focus:bg-white/10 focus:text-white">
                                                            {p.nome} ({p.sigla})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentStep(2)}
                                            className="flex-1 h-11 border-white/5 bg-transparent hover:bg-white/5 text-white rounded-lg flex items-center justify-center gap-2"
                                        >
                                            <ArrowLeft size={18} /> Voltar
                                        </Button>
                                        <Button
                                            onClick={handleNextStep}
                                            className="flex-[2] h-11 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-2 group"
                                        >
                                            Próximo <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* STEP 4: PREVIEW / REVISÃO */
                                <div className="space-y-5">
                                    {/* Preview Card */}
                                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
                                        {/* Logo */}
                                        {(logoPreview || formData.logomarca_url) && (
                                            <div className="flex justify-center">
                                                <img
                                                    src={logoPreview || formData.logomarca_url}
                                                    alt="Logo do Gabinete"
                                                    className="h-16 w-auto object-contain opacity-90"
                                                />
                                            </div>
                                        )}

                                        {/* Nome do Gabinete */}
                                        <div className="text-center space-y-1">
                                            <h3 className="text-lg font-bold text-white tracking-tight">
                                                {getNomeGabinete()}
                                            </h3>
                                            <p className="text-sm text-white/40">
                                                {getNomeCamara()}
                                            </p>
                                        </div>

                                        {/* Dados resumidos */}
                                        <div className="border-t border-white/[0.06] pt-4 space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white/30">Partido</span>
                                                <span className="text-white/70 font-medium">{getPartidoSelecionado()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white/30">Político</span>
                                                <span className="text-white/70 font-medium">{`${getPrefixoGenero(formData.genero)} ${formData.nome_politico}`.trim()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white/30">Responsável</span>
                                                <span className="text-white/70 font-medium">{formData.nome_completo}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white/30">Cidade</span>
                                                <span className="text-white/70 font-medium">
                                                    {cidades.find(c => c.id === formData.cidade_id)?.nome || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentStep(3)}
                                            className="flex-1 h-11 border-white/5 bg-transparent hover:bg-white/5 text-white rounded-lg flex items-center justify-center gap-2"
                                        >
                                            <ArrowLeft size={18} /> Voltar
                                        </Button>
                                        <Button
                                            onClick={handleFinalize}
                                            disabled={loading}
                                            className="flex-[2] h-11 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg shadow-xl shadow-white/5 transition-all flex items-center justify-center gap-2 group"
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Finalizar <CheckCircle size={18} className="group-hover:scale-110 transition-transform" /></>}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div >
            </div >

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-md bg-zinc-950 border-white/10 shadow-2xl shadow-white/5 animate-in zoom-in-95 duration-300">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Send className="w-8 h-8 text-white animate-bounce" />
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight text-white">
                                Quase lá! 🚀
                            </CardTitle>
                            <CardDescription className="text-white/40 pt-2">
                                Enviamos um e-mail de confirmação para <strong className="text-white/80">{formData.email}</strong>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-0">
                            <p className="text-center text-sm text-white/30 leading-relaxed">
                                Para garantir a segurança do seu gabinete, por favor clique no link que enviamos para o seu e-mail antes de fazer o primeiro login.
                            </p>
                            <Button
                                onClick={() => navigate('/login')}
                                className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-bold text-base rounded-xl transition-all shadow-xl shadow-white/5"
                            >
                                Entendi, ir para o Login
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div >
    );
};

export default SaaSOnboarding;
