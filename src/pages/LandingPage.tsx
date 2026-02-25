import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  ClipboardList, 
  Calendar, 
  Brain, 
  BarChart3, 
  CheckCircle,
  Check,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Target,
  MapPin,
  UserCheck,
  MessageSquare,
  Star,
  Award,
  Building2
} from "lucide-react";
import { Link } from "react-router-dom";
import legisfyLogo from "@/assets/legisfy-logo.png";
import legisfyLogoBlack from "@/assets/legisfy-logo-black.png";
import politicianDashboard from "@/assets/politician-dashboard.png";
import politicianWorkspace from "@/assets/politician-workspace.png";
import testimonialChefeGabinete from "@/assets/testimonial-chefe-gabinete.jpg";
import testimonialAssessora from "@/assets/testimonial-assessora.jpg";
import testimonialAssessorJovem from "@/assets/testimonial-assessor-jovem.jpg";
import { WhatsAppMockup } from "@/components/landing/WhatsAppMockup";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold font-poppins text-black">
              Legisfy
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#assessor-ia" className="text-gray-600 hover:text-gray-900 transition">Agente IA</a>
            <a href="#recursos" className="text-gray-600 hover:text-gray-900 transition">Recursos</a>
            <a href="#planos" className="text-gray-600 hover:text-gray-900 transition">Planos</a>
            <a href="#beneficios" className="text-gray-600 hover:text-gray-900 transition">Benefícios</a>
            <a href="#depoimentos" className="text-gray-600 hover:text-gray-900 transition">Depoimentos</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Button 
              className="bg-[image:var(--gradient-premium)] text-white hover:bg-[image:var(--gradient-premium-hover)] transition-all duration-300"
              onClick={() => window.open('https://api.whatsapp.com/send/?phone=5527999205531&text=Ol%C3%A1%2C+quero+uma+demonstra%C3%A7%C3%A3o+da+Legisfy.&type=phone_number&app_absent=0', '_blank')}
            >
              Agendar demonstração
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-16 px-4 relative overflow-hidden bg-white min-h-[calc(100vh-80px)] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-purple/3 via-transparent to-orange/3 pointer-events-none" />
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex flex-col items-start">
                <img src={legisfyLogo} alt="Legisfy" className="h-24 w-auto mb-2" />
                <Badge variant="outline" className="border-purple">
                  <Sparkles className="h-3 w-3 mr-1" />
                  PLATAFORMA INTELIGENTE PARA GABINETES DE VEREADORES E DEPUTADOS
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                Recursos poderosos para um{" "}
                <span className="bg-[image:var(--gradient-premium)] bg-clip-text text-transparent">
                  mandato inteligente
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">
                Organize eleitores, demandas e indicações, acompanhe sua agenda, gerencie sua equipe e tenha um <strong className="font-bold text-gray-900">Assessor IA disponível 24h por dia, 7 dias por semana.</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="outline">
                  Ver demonstração
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg mx-auto">
                {/* Eleitores Card */}
                <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="bg-gradient-to-br from-purple/10 to-purple/5 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                      <Users className="h-6 w-6 text-purple" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Eleitores</p>
                    <div className="flex items-end gap-1 h-12">
                      <div className="w-2 bg-purple/30 rounded-t" style={{ height: '40%' }}></div>
                      <div className="w-2 bg-purple/50 rounded-t" style={{ height: '65%' }}></div>
                      <div className="w-2 bg-purple/70 rounded-t" style={{ height: '85%' }}></div>
                      <div className="w-2 bg-purple rounded-t" style={{ height: '100%' }}></div>
                      <div className="w-2 bg-purple/80 rounded-t" style={{ height: '75%' }}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">+2,4k este mês</p>
                  </CardContent>
                </Card>

                {/* Demandas Card */}
                <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="bg-gradient-to-br from-orange/10 to-orange/5 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                      <ClipboardList className="h-6 w-6 text-orange" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Demandas</p>
                    <div className="space-y-1">
                      <div className="h-2 bg-orange rounded-full" style={{ width: '90%' }}></div>
                      <div className="h-2 bg-orange/70 rounded-full" style={{ width: '65%' }}></div>
                      <div className="h-2 bg-orange/50 rounded-full" style={{ width: '80%' }}></div>
                      <div className="h-2 bg-orange/30 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">340 resolvidas</p>
                  </CardContent>
                </Card>

                {/* Indicações Card */}
                <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="bg-gradient-to-br from-green/10 to-green/5 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                      <UserCheck className="h-6 w-6 text-green" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Indicações</p>
                    <div className="relative h-12">
                      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1">
                        <div className="w-1.5 bg-green/40 rounded-t h-6"></div>
                        <div className="w-1.5 bg-green/60 rounded-t h-8"></div>
                        <div className="w-1.5 bg-green/80 rounded-t h-10"></div>
                        <div className="w-1.5 bg-green rounded-t h-12"></div>
                        <div className="w-1.5 bg-green/70 rounded-t h-9"></div>
                        <div className="w-1.5 bg-green/50 rounded-t h-7"></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">128 protocoladas</p>
                  </CardContent>
                </Card>

                {/* Agenda Card */}
                <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="bg-gradient-to-br from-blue/10 to-blue/5 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                      <Calendar className="h-6 w-6 text-blue" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Agenda</p>
                    <div className="grid grid-cols-5 gap-1 h-12">
                      {[60, 40, 80, 55, 90].map((height, i) => (
                        <div key={i} className="flex flex-col justify-end">
                          <div 
                            className="w-full bg-blue rounded-t opacity-70 hover:opacity-100 transition-opacity" 
                            style={{ height: `${height}%` }}
                          ></div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">24 eventos</p>
                  </CardContent>
                </Card>

                {/* IA Card - Spanning 2 columns */}
                <Card className="col-span-2 bg-white border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="bg-gradient-to-br from-violet/10 to-violet/5 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                          <Brain className="h-6 w-6 text-violet" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">Assessor IA</p>
                        <p className="text-xs text-gray-600">Automatizando processos</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 bg-violet/30 rounded-full overflow-hidden">
                            <div className="h-full bg-violet rounded-full" style={{ width: '75%' }}></div>
                          </div>
                          <span className="text-xs font-medium text-gray-700">75%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 bg-violet/30 rounded-full overflow-hidden">
                            <div className="h-full bg-violet rounded-full" style={{ width: '92%' }}></div>
                          </div>
                          <span className="text-xs font-medium text-gray-700">92%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Assessor IA Section */}
      <section id="assessor-ia" className="py-20 px-4 bg-gradient-to-br from-violet/10 via-purple/5 to-transparent">
        <div className="container mx-auto">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-violet">
                <Brain className="h-3 w-3 mr-1" />
                ASSESSOR IA
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Assessor IA que trabalha{" "}
                <span className="bg-[image:var(--gradient-premium)] bg-clip-text text-transparent">
                  24h por dia, 7 dias por semana
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Um assistente inteligente que nunca descansa e está sempre pronto para ajudar seu gabinete
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Features Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Auxilia Assessores */}
                <Card className="hover:shadow-xl transition-all border-2 hover:border-violet/50 bg-white">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet/20 to-violet/5 flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-violet" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Auxilia os Assessores</h3>
                    <p className="text-gray-600 text-sm">
                      Apoia sua equipe nas atividades diárias do gabinete com respostas rápidas e automações inteligentes
                    </p>
                  </CardContent>
                </Card>

                {/* Atende o Munícipe */}
                <Card className="hover:shadow-xl transition-all border-2 hover:border-purple/50 bg-white">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple/20 to-purple/5 flex items-center justify-center mb-4">
                      <MessageSquare className="h-6 w-6 text-purple" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Atende o Munícipe</h3>
                    <p className="text-gray-600 text-sm">
                      Responde automaticamente às solicitações dos cidadãos com agilidade e eficiência a qualquer hora
                    </p>
                  </CardContent>
                </Card>

                {/* Registra Demandas */}
                <Card className="hover:shadow-xl transition-all border-2 hover:border-orange/50 bg-white">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange/20 to-orange/5 flex items-center justify-center mb-4">
                      <ClipboardList className="h-6 w-6 text-orange" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Registra e Atualiza Demandas</h3>
                    <p className="text-gray-600 text-sm">
                      Protocola automaticamente novas demandas e mantém o status atualizado em tempo real
                    </p>
                  </CardContent>
                </Card>

                {/* Cadastra Indicações */}
                <Card className="hover:shadow-xl transition-all border-2 hover:border-green/50 bg-white">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green/20 to-green/5 flex items-center justify-center mb-4">
                      <UserCheck className="h-6 w-6 text-green" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Cadastra e Acompanha Indicações</h3>
                    <p className="text-gray-600 text-sm">
                      Registra indicações políticas e faz o acompanhamento contínuo de cada processo
                    </p>
                  </CardContent>
                </Card>

                {/* Marca Agenda */}
                <Card className="hover:shadow-xl transition-all border-2 hover:border-blue/50 bg-white">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue/20 to-blue/5 flex items-center justify-center mb-4">
                      <Calendar className="h-6 w-6 text-blue" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Marca Agenda e Envia Lembretes</h3>
                    <p className="text-gray-600 text-sm">
                      Organiza compromissos automaticamente e envia lembretes para não perder nenhum evento
                    </p>
                  </CardContent>
                </Card>

                {/* Disponibilidade 24/7 - Destaque */}
                <Card className="hover:shadow-xl transition-all border-2 border-violet bg-gradient-to-br from-violet/10 to-transparent">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet to-violet/80 flex items-center justify-center mb-4">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Sempre Disponível</h3>
                    <p className="text-gray-600 text-sm">
                      <strong className="text-violet">24 horas por dia, 7 dias por semana</strong>, sem pausas, férias ou descanso
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - WhatsApp Mockup */}
              <div className="flex items-center justify-center">
                <WhatsAppMockup />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Sistema de Metas e Pontuação Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-orange">
                <Target className="h-3 w-3 mr-1" />
                PRODUTIVIDADE E ENGAJAMENTO
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Plataforma fácil que{" "}
                <span className="bg-[image:var(--gradient-premium)] bg-clip-text text-transparent">
                  toda a equipe consegue usar
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Sistema de metas e pontuação definido pela chefia que transforma a produtividade do gabinete
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Facilidade de Uso */}
              <Card className="hover:shadow-xl transition-all border-2 hover:border-green/50 bg-white">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green/20 to-green/5 flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Interface Intuitiva</h3>
                  <p className="text-gray-600 text-sm">
                    Plataforma simples e fácil de usar. Mesmo assessores com dificuldade em tecnologia conseguem operar sem problemas
                  </p>
                </CardContent>
              </Card>

              {/* Sistema de Metas */}
              <Card className="hover:shadow-xl transition-all border-2 hover:border-orange/50 bg-white">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange/20 to-orange/5 flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-orange" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Metas Personalizadas</h3>
                  <p className="text-gray-600 text-sm">
                    O político ou chefe de gabinete define as metas e o sistema de pontuação ideal para a equipe
                  </p>
                </CardContent>
              </Card>

              {/* Produtividade */}
              <Card className="hover:shadow-xl transition-all border-2 hover:border-purple/50 bg-white">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple/20 to-purple/5 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-purple" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Produtividade em Alta</h3>
                  <p className="text-gray-600 text-sm">
                    Com metas claras e pontuação visível, a equipe se motiva e os resultados disparam
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Depoimento do Chefe de Gabinete */}
            <Card className="border-2 border-violet bg-gradient-to-br from-violet/5 to-transparent">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet to-violet/80 flex items-center justify-center flex-shrink-0">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg text-gray-700 italic mb-4">
                      "Minha equipe sempre teve dificuldade com outros sistemas e tecnologia em geral. Mas com a Legisfy, todos conseguem usar facilmente. O Assessor IA ajuda muito no dia a dia, respondendo dúvidas e automatizando tarefas. Depois que implementei o sistema de metas e pontuação, foi impressionante - o gabinete disparou na produção legislativa. Hoje somos referência em eficiência!"
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-gradient-to-r from-violet/50 to-transparent"></div>
                      <div>
                        <p className="font-semibold text-gray-900">Carlos Mendes</p>
                        <p className="text-sm text-gray-600">Chefe de Gabinete</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-12">
              <Link to="/auth">
                <Button size="lg" className="bg-[image:var(--gradient-premium)] text-white hover:bg-[image:var(--gradient-premium-hover)] transition-all duration-300">
                  Transformar Meu Gabinete Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="depoimentos" className="py-20 px-4 bg-gradient-to-b from-white via-violet/5 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-purple">
              <Star className="h-3 w-3 mr-1" />
              FERRAMENTA #1 EM AI AGENTS
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              A ferramenta queridinha nos{" "}
              <span className="bg-[image:var(--gradient-premium)] bg-clip-text text-transparent">
                gabinetes de Vereadores e Deputados
              </span>
            </h2>
          </div>

          {/* Testimonial 1 - Image Left */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="relative max-w-[60%] mx-auto">
              <div className="aspect-[3/4] bg-gradient-to-br from-purple/20 to-violet/10 rounded-2xl overflow-hidden">
                <img 
                  src={testimonialChefeGabinete} 
                  alt="Chefe de Gabinete" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                "Trabalho há mais de 30 anos em gabinete e nunca vi uma ferramenta tão prática. A equipe se adaptou rápido porque a Legisfy é simples de usar — até quem tinha dificuldade com tecnologia consegue operar. Hoje tudo está mais organizado, e o atendimento ao público ficou muito mais eficiente."
              </p>
              <div>
                <p className="font-semibold text-gray-900 text-lg">Ricardo Pereira</p>
                <p className="text-purple text-sm">Chefe de Gabinete • 60 anos</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 - Image Right */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6 md:order-1">
              <p className="text-lg text-gray-700 leading-relaxed">
                "O Assessor IA mudou completamente minha rotina. Ele me ajuda a registrar demandas, protocolar indicações, montar agendas e até responder os eleitores. Ganho tempo todos os dias e consigo focar no que realmente importa dentro do gabinete."
              </p>
              <div>
                <p className="font-semibold text-gray-900 text-lg">Ana Beatriz</p>
                <p className="text-purple text-sm">Assessora • 40 anos</p>
              </div>
            </div>
            <div className="relative md:order-2 max-w-[60%] mx-auto">
              <div className="aspect-[3/4] bg-gradient-to-br from-magenta/20 to-pink/10 rounded-2xl overflow-hidden">
                <img 
                  src={testimonialAssessora} 
                  alt="Assessora" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Testimonial 3 - Image Left */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative max-w-[60%] mx-auto">
              <div className="aspect-[3/4] bg-gradient-to-br from-orange/20 to-yellow/10 rounded-2xl overflow-hidden">
                <img 
                  src={testimonialAssessorJovem} 
                  alt="Assessor Jovem" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                "A Legisfy é uma ferramenta poderosa. Organiza nossos eleitores, facilita o acompanhamento das demandas e ainda ajuda nas ações de marketing do mandato. O gabinete ficou mais profissional e os resultados apareceram rápido."
              </p>
              <div>
                <p className="font-semibold text-gray-900 text-lg">Rafael Campos</p>
                <p className="text-purple text-sm">Assessor de comunicação • 30 anos</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="recursos" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4">RECURSOS</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-600">
              Ferramentas completas para gestão eficiente do seu mandato
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow bg-white">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple/20 to-purple/5 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Gestão de Eleitores</h3>
                <p className="text-sm text-gray-600">
                  Cadastro completo com geolocalização e histórico de interações
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-white">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange/20 to-orange/5 flex items-center justify-center mb-4">
                  <ClipboardList className="h-6 w-6 text-orange" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Gestão de Demandas</h3>
                <p className="text-sm text-gray-600">
                  Protocolo automático e acompanhamento em tempo real
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-white">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue/20 to-blue/5 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-blue" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Agenda Inteligente</h3>
                <p className="text-sm text-gray-600">
                  Organização automática de compromissos e eventos
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-white">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet/20 to-violet/5 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-violet" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Inteligência Artificial</h3>
                <p className="text-sm text-gray-600">
                  Assistente virtual para otimizar processos do gabinete
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-white">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green/20 to-green/5 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-green" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600">
                  Relatórios e insights para tomada de decisão
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-white">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple/20 to-purple/5 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-purple" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Geolocalização</h3>
                <p className="text-sm text-gray-600">
                  Mapeamento territorial de eleitores e demandas
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-white">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange/20 to-orange/5 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-orange" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Metas e Premiações</h3>
                <p className="text-sm text-gray-600">
                  Sistema de gamificação para motivar a equipe
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-white">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green/20 to-green/5 flex items-center justify-center mb-4">
                  <UserCheck className="h-6 w-6 text-green" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Gestão de Indicações</h3>
                <p className="text-sm text-gray-600">
                  Acompanhe e gerencie todas as indicações políticas em tempo real
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4 bg-black">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 border-blue text-blue bg-blue/10">
                <Shield className="h-3 w-3 mr-1" />
                SEGURANÇA E PRIVACIDADE
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                Seus dados{" "}
                <span className="bg-[image:var(--gradient-premium)] bg-clip-text text-transparent">
                  100% protegidos
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Segurança de nível bancário para garantir a privacidade e integridade das informações do seu gabinete
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Acesso Restrito */}
              <Card className="border border-blue/30 hover:border-blue/50 transition-all hover:shadow-lg bg-white">
                <CardContent className="p-8">
                  <div className="h-14 w-14 rounded-xl bg-blue/10 flex items-center justify-center mb-6">
                    <Shield className="h-7 w-7 text-blue" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Acesso Restrito ao Gabinete</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Somente membros autorizados do seu gabinete têm acesso aos dados. Sistema de permissões granulares garante que cada usuário visualize apenas o que precisa.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue"></div>
                      <span className="text-sm text-gray-600">Controle total de permissões por usuário</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue"></div>
                      <span className="text-sm text-gray-600">Auditoria completa de acessos e ações</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue"></div>
                      <span className="text-sm text-gray-600">Isolamento total entre gabinetes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Autenticação 2FA */}
              <Card className="border border-purple/30 hover:border-purple/50 transition-all hover:shadow-lg bg-white">
                <CardContent className="p-8">
                  <div className="h-14 w-14 rounded-xl bg-purple/10 flex items-center justify-center mb-6">
                    <CheckCircle className="h-7 w-7 text-purple" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Autenticação de Dois Fatores</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Proteção extra com verificação em duas etapas. Mesmo que sua senha seja comprometida, seus dados permanecem seguros.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-purple"></div>
                      <span className="text-sm text-gray-600">Código de verificação via SMS ou email</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-purple"></div>
                      <span className="text-sm text-gray-600">Proteção contra acessos não autorizados</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-purple"></div>
                      <span className="text-sm text-gray-600">Configuração simples e rápida</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exportação e Importação */}
              <Card className="border border-green/30 hover:border-green/50 transition-all hover:shadow-lg bg-white">
                <CardContent className="p-8">
                  <div className="h-14 w-14 rounded-xl bg-green/10 flex items-center justify-center mb-6">
                    <TrendingUp className="h-7 w-7 text-green" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Controle Total dos Dados</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Exporte e importe seus dados quando quiser. Você é o dono das informações e tem total liberdade para gerenciá-las.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green"></div>
                      <span className="text-sm text-gray-600">Exportação em formatos padronizados</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green"></div>
                      <span className="text-sm text-gray-600">Backup automático e manual</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green"></div>
                      <span className="text-sm text-gray-600">Migração facilitada de dados</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conformidade LGPD */}
              <Card className="border border-orange/30 hover:border-orange/50 transition-all hover:shadow-lg bg-white">
                <CardContent className="p-8">
                  <div className="h-14 w-14 rounded-xl bg-orange/10 flex items-center justify-center mb-6">
                    <CheckCircle className="h-7 w-7 text-orange" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Conformidade com LGPD</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Total conformidade com a Lei Geral de Proteção de Dados. Seus eleitores têm seus direitos garantidos.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-orange"></div>
                      <span className="text-sm text-gray-600">Criptografia de ponta a ponta</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-orange"></div>
                      <span className="text-sm text-gray-600">Gestão de consentimento integrada</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-orange"></div>
                      <span className="text-sm text-gray-600">Direito ao esquecimento automatizado</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trust Banner */}
            <Card className="border border-white/10 bg-white overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
                      Proteja o que é mais importante: a{" "}
                      <span className="bg-[image:var(--gradient-premium)] bg-clip-text text-transparent">
                        confiança dos seus eleitores
                      </span>
                    </h3>
                    <p className="text-lg text-gray-600 mb-6">
                      Infraestrutura de segurança de classe mundial, com monitoramento 24/7 e certificações internacionais.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      <Badge className="bg-blue/10 text-blue border-blue/30 px-4 py-2">
                        <Shield className="h-4 w-4 mr-2" />
                        SSL/TLS
                      </Badge>
                      <Badge className="bg-green/10 text-green border-green/30 px-4 py-2">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Criptografia AES-256
                      </Badge>
                      <Badge className="bg-purple/10 text-purple border-purple/30 px-4 py-2">
                        <Shield className="h-4 w-4 mr-2" />
                        Backup Diário
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-center md:justify-end flex-shrink-0">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue via-purple to-orange flex items-center justify-center">
                      <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center">
                        <Shield className="h-14 w-14 text-blue" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-4">BENEFÍCIOS</Badge>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                Por que escolher o Legisfy?
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple/20 to-purple/5 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-purple" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-gray-900">Economia de tempo</h3>
                    <p className="text-gray-600">
                      Automatize tarefas repetitivas e foque no que realmente importa
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange/20 to-orange/5 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-orange" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-gray-900">Aumento de produtividade</h3>
                    <p className="text-gray-600">
                      Gerencie mais demandas em menos tempo com eficiência
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue/20 to-blue/5 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-gray-900">Melhor atendimento</h3>
                    <p className="text-gray-600">
                      Ofereça respostas rápidas e precisas aos seus eleitores
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet/20 to-violet/5 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-5 w-5 text-violet" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-gray-900">Inteligência artificial</h3>
                    <p className="text-gray-600">
                      Tome decisões baseadas em dados e insights inteligentes
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative flex justify-center">
              <img 
                src={politicianWorkspace} 
                alt="Político utilizando tecnologia com inteligência artificial" 
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Plans Section */}
      <section id="planos" className="py-16 px-4 bg-gradient-to-br from-gray-50 via-purple/5 to-violet/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-gray-400">
              <Shield className="h-3 w-3 mr-1" />
              SOLUÇÃO INSTITUCIONAL
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Exclusivo para instituições públicas
            </h2>
            <p className="text-xl font-bold bg-[image:var(--gradient-premium)] bg-clip-text text-transparent max-w-2xl mx-auto">
              Solução completa para Câmaras Municipais e Assembleias Legislativas em todo o Brasil
            </p>
          </div>

          <Card className="border-2 border-gray-300 bg-white rounded-3xl overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-5 gap-0">
                {/* Left Side - Visual */}
                <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 via-gray-800 to-black p-12 flex flex-col justify-center items-center text-white relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                  </div>
                  <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm mb-6">
                      <Building2 className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold mb-4">LEGISFY INSTITUCIONAL</h3>
                    <p className="text-lg font-medium mb-2">Solução completa</p>
                    <Badge className="bg-[image:var(--gradient-premium)] text-white font-bold px-4 py-2 text-sm">
                      <Building2 className="h-4 w-4 mr-1" />
                      PLANO INSTITUCIONAL
                    </Badge>
                  </div>
                </div>

                {/* Right Side - Content */}
                <div className="lg:col-span-3 p-12">
                  <Badge className="bg-orange/10 text-orange border-orange/20 mb-4 w-fit">
                    <Sparkles className="h-3 w-3 mr-1" />
                    TODOS OS RECURSOS INSTITUCIONAIS
                  </Badge>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">
                    Feito para: <span className="bg-[image:var(--gradient-premium)] bg-clip-text text-transparent">Câmaras Municipais • Assembleias Legislativas • Gabinetes de Vereadores e Deputados</span>
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Até 25 usuários</p>
                        <p className="text-xs text-gray-600">Equipe completa com acesso seguro</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Demandas ilimitadas</p>
                        <p className="text-xs text-gray-600">Gestão completa de solicitações</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Eleitores ilimitados</p>
                        <p className="text-xs text-gray-600">Organize e acompanhe sua base eleitoral</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Indicações ilimitadas</p>
                        <p className="text-xs text-gray-600">Controle total de indicações</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Gestão de equipe</p>
                        <p className="text-xs text-gray-600">Gerenciamento completo de assessores</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Agenda integrada</p>
                        <p className="text-xs text-gray-600">Organize compromissos e eventos</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Moções e votos</p>
                        <p className="text-xs text-gray-600">Registro e acompanhamento legislativo</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Suporte dedicado</p>
                        <p className="text-xs text-gray-600">Atendimento prioritário e personalizado</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Segurança e privacidade</p>
                        <p className="text-xs text-gray-600">Conformidade com LGPD e proteção de dados</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Dashboards completos</p>
                        <p className="text-xs text-gray-600">Analytics e insights estratégicos</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Mapa inteligente de eleitores</p>
                        <p className="text-xs text-gray-600">Visualização geográfica da base</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Sistema de pontuação e metas</p>
                        <p className="text-xs text-gray-600">Gamificação e engajamento da equipe</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Organização de públicos</p>
                        <p className="text-xs text-gray-600">Segmentação avançada de eleitores</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Campanhas no WhatsApp</p>
                        <p className="text-xs text-gray-600">Envio de mensagens em massa</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Lembretes pelo WhatsApp</p>
                        <p className="text-xs text-gray-600">Automação de comunicação</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Portal Transparência moderno</p>
                        <p className="text-xs text-gray-600">Dashboards para valorizar o legislativo</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-violet/10 via-purple/10 to-orange/10 p-6 rounded-2xl border-2 border-violet/30 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet to-purple flex items-center justify-center flex-shrink-0">
                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold mb-3 text-gray-900">
                          Assessor IA <span className="bg-[image:var(--gradient-premium)] bg-clip-text text-transparent">Exclusivo</span>
                        </h4>
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                          Um agente inteligente com <strong>nome, comportamento e foto personalizados</strong>, atuando dentro do WhatsApp do gabinete para atender eleitores, auxiliar assessores e executar tarefas automaticamente:
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-violet" />
                            <span className="text-sm font-semibold text-gray-900">Registrar agenda</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-violet" />
                            <span className="text-sm font-semibold text-gray-900">Cadastrar demanda</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-violet" />
                            <span className="text-sm font-semibold text-gray-900">Incluir indicação</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                    <p className="text-center font-semibold text-gray-900 italic text-sm">
                      "A solução completa e automatizada para gabinetes de alta performance."
                    </p>
                  </div>

                  <Button 
                    className="w-full bg-[image:var(--gradient-premium)] hover:bg-[image:var(--gradient-premium-hover)] text-white h-14 text-lg font-semibold rounded-xl shadow-lg"
                    onClick={() => window.open('https://api.whatsapp.com/send/?phone=5527999205531&text=Ol%C3%A1%2C+quero+uma+demonstra%C3%A7%C3%A3o+da+Legisfy.&type=phone_number&app_absent=0', '_blank')}
                  >
                    Solicitar demonstração
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-white border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col items-center space-y-4">
            <img src={legisfyLogoBlack} alt="Legisfy" className="h-16 w-auto" />
            <p className="text-sm text-gray-600">
              A plataforma completa para gestão de mandatos políticos
            </p>
            <div className="flex flex-col items-center gap-2 text-sm text-gray-600 mt-4">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Vitória-ES
              </p>
              <p>Email: contato@legisfy.app.br</p>
              <p>Contato: (27) 9 9920-5531</p>
            </div>
            <div className="border-t w-full pt-6 text-center text-sm text-gray-600">
              <p>© 2025 Legisfy. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
