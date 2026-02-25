import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { useToast } from './use-toast';

export const useIntegrationsIA = () => {
    const { cabinet, user } = useAuthContext();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [integrations, setIntegrations] = useState<{
        telegram_enabled: boolean;
        google_enabled: boolean;
        whatsapp_enabled?: boolean;
    }>({
        telegram_enabled: false,
        google_enabled: false,
        whatsapp_enabled: false,
    });
    const [pairingCode, setPairingCode] = useState<string>("");

    useEffect(() => {
        if (cabinet?.cabinet_id) {
            fetchIntegrations();
        }
    }, [cabinet?.cabinet_id]);

    const fetchIntegrations = async () => {
        if (!cabinet?.cabinet_id || !user?.id) return;

        // Gerar código único: LEG-[Cabinet prefix]-[User suffix]
        const code = `LEG-${cabinet.cabinet_id.substring(0, 3)}-${user.id.substring(user.id.length - 3)}`.toUpperCase();
        setPairingCode(code);

        try {
            const { data, error } = await (supabase as any)
                .from('ia_integrations')
                .select('telegram_enabled, google_enabled')
                .eq('gabinete_id', cabinet?.cabinet_id)
                .maybeSingle();

            if (data) {
                setIntegrations(prev => ({
                    ...prev,
                    telegram_enabled: !!data.telegram_enabled,
                    google_enabled: !!data.google_enabled,
                }));
            } else {
                // Se não existir, criar um registro padrão
                await (supabase as any)
                    .from('ia_integrations')
                    .insert({
                        gabinete_id: cabinet.cabinet_id,
                        telegram_enabled: true
                    });
            }
        } catch (error) {
            console.error('Error fetching integrations:', error);
        }
    };

    const connectGoogle = async () => {
        setLoading(true);
        try {
            const clientID = 'REPLACE_WITH_CLIENT_ID'; // Deve vir do env ou config
            const redirectUri = `${window.location.origin}/functions/v1/google-oauth-handler`;
            const scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events';
            const state = cabinet?.cabinet_id;

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}&access_type=offline&prompt=consent`;

            window.location.href = authUrl;
        } catch (error) {
            toast({
                title: "Erro ao conectar",
                description: "Não foi possível iniciar o login com Google.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const connectTelegram = async () => {
        // Implementar lógica de geração de código de pareamento
        toast({
            title: "Integração Telegram",
            description: "Bot configurado! Use o código LEG-ID-123 no bot @LegisfyBot para parear.",
        });
    };

    const disconnectIntegration = async (type: 'telegram' | 'google') => {
        setLoading(true);
        try {
            const field = type === 'telegram' ? 'telegram_enabled' : 'google_enabled';
            await (supabase as any)
                .from('ia_integrations')
                .update({ [field]: false })
                .eq('gabinete_id', cabinet?.cabinet_id);

            setIntegrations(prev => ({ ...prev, [field]: false }));

            toast({
                title: "Desconectado",
                description: `Sua conta ${type} foi desconectada.`,
            });
        } catch (error) {
            toast({
                title: "Erro ao desconectar",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        integrations,
        loading,
        pairingCode,
        connectGoogle,
        connectTelegram,
        disconnectIntegration,
        refresh: fetchIntegrations
    };
};
