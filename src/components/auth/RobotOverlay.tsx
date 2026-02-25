import React from 'react';
import {
    BarChart3, Users, MapPin, ListChecks, TrendingUp, Activity, Globe,
    ShieldCheck, Building2, Lock, Zap, Key, UserCheck, MousePointerClick
} from 'lucide-react';

const FloatingCard = ({ children, className, delay = "0s", style }: { children: React.ReactNode, className?: string, delay?: string, style?: React.CSSProperties }) => (
    <div
        className={`absolute bg-zinc-950/40 backdrop-blur-md border border-white/10 rounded-lg p-2 shadow-2xl animate-float pointer-events-none ${className}`}
        style={{ ...style, animationDelay: delay }}
    >
        {children}
    </div>
);

const LineChart = () => (
    <svg viewBox="0 0 100 40" className="w-full h-8 overflow-visible">
        <path
            d="M0 30 Q 20 5, 40 20 T 80 10 T 100 25"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="animate-pulse"
        />
        <circle cx="100" cy="25" r="1.5" fill="#3b82f6" className="animate-ping" />
    </svg>
);

const BrazilMap = () => (
    <svg viewBox="0 0 200 200" className="w-full h-20 opacity-80">
        <path
            fill="#10b981"
            fillOpacity="0.2"
            stroke="#10b981"
            strokeWidth="0.8"
            d="M150,50 L160,60 L170,80 L165,110 L140,150 L110,170 L80,165 L50,140 L40,100 L60,60 L90,40 L120,35 Z"
            className="animate-pulse"
        />
        <circle cx="150" cy="70" r="3" fill="#10b981" fillOpacity="0.8" className="animate-ping" />
        <circle cx="130" cy="110" r="2" fill="#10b981" fillOpacity="0.6" />
        <circle cx="100" cy="140" r="4" fill="#10b981" fillOpacity="0.9" className="animate-ping" />
        <circle cx="80" cy="90" r="2" fill="#34d399" fillOpacity="0.5" />
    </svg>
);

interface RobotOverlayProps {
    mode?: 'auth' | 'onboarding';
}

export default function RobotOverlay({ mode = 'auth' }: RobotOverlayProps) {
    return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            <style>{`
        @keyframes custom-float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-10px) translateX(4px); }
          50% { transform: translateY(-2px) translateX(-3px); }
          75% { transform: translateY(-14px) translateX(2px); }
        }
        .animate-float {
          animation: custom-float 9s ease-in-out infinite;
        }
      `}</style>

            {mode === 'auth' ? (
                <>
                    {/* Auth Mode Cards (Legado) */}
                    <FloatingCard className="top-[5%] left-[8%] w-32" delay="0s">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="p-1 bg-amber-500/10 rounded">
                                <Activity className="h-2.5 w-2.5 text-amber-400" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Demandas</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px]">
                                <span className="text-white/30 font-bold">42</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-[65%] bg-amber-500" />
                            </div>
                        </div>
                    </FloatingCard>

                    <FloatingCard className="top-[45%] left-[2%] -translate-y-1/2 w-28" delay="1s">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="p-1 bg-purple-500/10 rounded">
                                <ListChecks className="h-2.5 w-2.5 text-purple-400" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Indicações</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-white leading-none">892</span>
                        </div>
                    </FloatingCard>

                    <FloatingCard className="bottom-[8%] left-[8%] w-32" delay="2s">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="p-1 bg-indigo-500/10 rounded">
                                <Users className="h-2.5 w-2.5 text-indigo-400" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Eleitores</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-white leading-none">12.4K</span>
                            <span className="text-[7px] text-green-400 font-bold">+2.1%</span>
                        </div>
                    </FloatingCard>

                    <FloatingCard className="top-[15%] right-[8%] w-36" delay="0.5s">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="p-1 bg-blue-500/10 rounded">
                                <TrendingUp className="h-2.5 w-2.5 text-blue-400" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Produção legislativa</span>
                        </div>
                        <LineChart />
                    </FloatingCard>

                    <FloatingCard className="bottom-[12%] right-[8%] w-40" delay="1.5s">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="p-1 bg-emerald-500/10 rounded">
                                <Globe className="h-2.5 w-2.5 text-emerald-400" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Geolocalização</span>
                        </div>
                        <BrazilMap />
                        <div className="mt-1 flex justify-center">
                            <span className="text-[6px] text-emerald-400/30 uppercase font-black">Escala Nacional</span>
                        </div>
                    </FloatingCard>
                </>
            ) : (
                <>
                    {/* Onboarding Mode Cards */}
                    <FloatingCard className="top-[55%] right-[10%] w-36" delay="0.0s">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="p-1 bg-emerald-500/10 rounded">
                                <Lock className="h-2.5 w-2.5 text-emerald-400" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Segurança de Dados</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-white/70 font-medium">Dados Criptografados</span>
                        </div>
                    </FloatingCard>

                    <FloatingCard className="top-[45%] left-[3%] -translate-y-1/2 w-32" delay="1.2s">
                        <div className="flex items-center gap-1.5 mb-2">
                            <div className="p-1 bg-blue-500/10 rounded">
                                <Building2 className="h-2.5 w-2.5 text-blue-400" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Instituição</span>
                        </div>
                        <div className="space-y-1">
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-[100%] bg-blue-500 animate-[shimmer_2s_infinite]" />
                            </div>
                            <span className="text-[7px] text-blue-400/50 uppercase font-bold">Câmara Vinculada</span>
                        </div>
                    </FloatingCard>

                    <FloatingCard className="bottom-[10%] left-[10%] w-36" delay="2.5s">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="p-1 bg-zinc-500/10 rounded">
                                <Lock className="h-2.5 w-2.5 text-zinc-400" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Segurança</span>
                        </div>
                        <span className="text-[9px] text-white/40 leading-tight block">Criptografia de ponta a ponta ativa.</span>
                    </FloatingCard>

                    <FloatingCard className="top-[20%] right-[10%] w-40" delay="0.8s">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="p-1 bg-amber-500/10 rounded">
                                <MousePointerClick className="h-2.5 w-2.5 text-amber-400" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Setup Express</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-white leading-none">3 Cliques</span>
                            <span className="text-[7px] text-amber-400/50 font-bold">⚡</span>
                        </div>
                    </FloatingCard>

                    <FloatingCard className="bottom-[15%] right-[10%] w-36" delay="1.8s">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="p-1 bg-indigo-500/10 rounded">
                                <Key className="h-2.5 w-2.5 text-indigo-400" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Acesso Direto</span>
                        </div>
                        <div className="flex -space-x-1.5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-4 w-4 rounded-full border border-zinc-950 bg-zinc-800 flex items-center justify-center">
                                    <UserCheck className="h-2 w-2 text-white/40" />
                                </div>
                            ))}
                        </div>
                    </FloatingCard>
                </>
            )}

            {/* Connection Atmosphere */}
            <div className="absolute top-1/2 left-[20%] w-32 h-[1px] bg-gradient-to-r from-transparent via-zinc-500/10 to-transparent -rotate-12 pointer-events-none" />
            <div className="absolute top-[40%] right-[15%] w-24 h-[1px] bg-gradient-to-r from-transparent via-zinc-500/10 to-transparent rotate-12 pointer-events-none" />
        </div>
    );
}
