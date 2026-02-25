import { useState, useEffect } from "react";
import { Plus, Users, FileText, MessageSquare, Lightbulb, TrendingUp, Calendar, MapPin, UserPlus, FileDown, Phone, Zap, Shield, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EnhancedVoterModal } from "@/components/modals/EnhancedVoterModal";
import { NewIndicationModal } from "@/components/modals/MultiStepIndicationModal";
import { NewDemandModal } from "@/components/modals/MultiStepDemandModal";
import { NewIdeaModal } from "@/components/modals/MultiStepIdeaModal";
import { PromotionalBanner } from "@/components/ui/promotional-banner";
import { ComunicadoPopupModal } from "@/components/modals/ComunicadoPopupModal";
import { supabase } from "@/integrations/supabase/client";
import { useGabineteData } from "@/hooks/useGabineteData";
import { useMonthlyStats } from "@/hooks/useMonthlyStats";
import { MetasRewards } from "@/components/dashboard/MetasRewards";
import { DashboardAgenda } from "@/components/dashboard/DashboardAgenda";
import { StatsCard } from "@/components/ui/standard-card";

interface Comunicado {
  id: string;
  titulo: string;
  descricao?: string;
  imagem_url?: string;
  texto_botao: string;
  link_botao: string;
  ativo: boolean;
  tipo?: 'texto' | 'banner' | 'dashboard' | 'login' | 'popup';
  target_institution_id?: string;
  target_user_roles?: string[];
  banner_width?: number;
  banner_height?: number;
  data_inicio?: string;
  data_fim?: string;
  data_inicio_hora?: string;
  data_fim_hora?: string;
  total_clicks?: number;
  total_views?: number;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const [newVoterOpen, setNewVoterOpen] = useState(false);
  const [newIndicationOpen, setNewIndicationOpen] = useState(false);
  const [newDemandOpen, setNewDemandOpen] = useState(false);
  const [newIdeaOpen, setNewIdeaOpen] = useState(false);
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [popupComunicado, setPopupComunicado] = useState<Comunicado | null>(null);
  const { stats, assessorRanking, recentActivities, loading } = useGabineteData();
  const { monthlyData, upcomingEvents, loading: monthlyLoading } = useMonthlyStats();

  useEffect(() => {
    fetchActiveComunicados();
  }, []);

  const fetchActiveComunicados = async () => {
    try {
      const { data, error } = await supabase
        .from('comunicados')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];

      const dashboardComunicados = (data || []).filter(comunicado => {
        const isDashboard = comunicado.tipo === 'dashboard';
        const hasImage = !!comunicado.imagem_url;

        if (!isDashboard || !hasImage) return false;

        if (comunicado.data_inicio) {
          const startDate = comunicado.data_inicio.split(' ')[0] || comunicado.data_inicio.split('T')[0];
          if (startDate > currentDate) return false;
        }

        if (comunicado.data_fim) {
          const endDate = comunicado.data_fim.split(' ')[0] || comunicado.data_fim.split('T')[0];
          if (endDate < currentDate) return false;
        }

        return true;
      });

      setComunicados(dashboardComunicados);

      const popupComunicados = (data || []).filter(comunicado => {
        const isPopup = comunicado.tipo === 'popup';
        if (!isPopup) return false;

        if (comunicado.data_inicio) {
          const startDate = comunicado.data_inicio.split(' ')[0] || comunicado.data_inicio.split('T')[0];
          if (startDate > currentDate) return false;
        }

        if (comunicado.data_fim) {
          const endDate = comunicado.data_fim.split(' ')[0] || comunicado.data_fim.split('T')[0];
          if (endDate < currentDate) return false;
        }

        return true;
      });

      if (popupComunicados.length > 0) {
        setPopupComunicado(popupComunicados[0]);
      }
    } catch (error) {
      console.error('Error fetching comunicados:', error);
    }
  };

  const handleTrackClick = async (comunicadoId: string) => {
    try {
      await supabase.rpc('register_comunicado_metric', {
        p_comunicado_id: comunicadoId,
        p_action_type: 'click'
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  if (loading || monthlyLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Carregando dados do gabinete...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Banner */}
      {comunicados.length > 0 && comunicados.map((comunicado) => (
        <div
          key={comunicado.id}
          className="relative mx-auto overflow-hidden rounded-lg bg-background shadow-lg border border-border mb-6"
          style={{ maxWidth: '1200px' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setComunicados(prev => prev.filter(c => c.id !== comunicado.id));
            }}
            className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all"
            aria-label="Fechar banner"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div
            className={`relative w-full ${comunicado.link_botao && comunicado.link_botao !== '#' ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
            style={{ height: '600px', maxWidth: '1200px' }}
            onClick={comunicado.link_botao && comunicado.link_botao !== '#' ? async () => {
              window.open(comunicado.link_botao, '_blank');
              await handleTrackClick(comunicado.id);
            } : undefined}
          >
            <img
              src={comunicado.imagem_url}
              alt={comunicado.titulo || 'Banner do gabinete'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ))}

      {/* Popup Modal */}
      {popupComunicado && (
        <ComunicadoPopupModal
          comunicado={popupComunicado}
          onClose={() => setPopupComunicado(null)}
          onTrackClick={handleTrackClick}
        />
      )}

      {/* Agenda Imediata */}
      <DashboardAgenda events={upcomingEvents} loading={monthlyLoading} />
    </div>
  );
}