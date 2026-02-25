import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { UnifiedMap } from "@/components/maps/UnifiedMap";
import { useEleitoresWithStats } from "@/hooks/useEleitoresWithStats";
import { useRealIndicacoes } from "@/hooks/useRealIndicacoes";
import { useRealDemandas } from "@/hooks/useRealDemandas";
import { useAuthContext } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

const cidadesCoordinates: { [key: string]: [number, number] } = {
    "rio de janeiro": [-43.1729, -22.9068],
    "são paulo": [-46.6388, -23.5505],
    "vitória": [-40.2976, -20.2976],
};

const Mapa = () => {
    const { cabinet } = useAuthContext();
    const { eleitores } = useEleitoresWithStats();
    const { indicacoes } = useRealIndicacoes();
    const { demandas } = useRealDemandas();
    const [cabinetCity, setCabinetCity] = useState<{ name: string; coords: [number, number] }>({
        name: "Vitória",
        coords: cidadesCoordinates["vitória"],
    });

    useEffect(() => {
        const fetchCabinetCity = async () => {
            if (cabinet?.city_name) {
                const cityKey = cabinet.city_name.toLowerCase();
                const coords = cidadesCoordinates[cityKey] || cidadesCoordinates["vitória"];
                setCabinetCity({ name: cabinet.city_name, coords });
                return;
            }

            if (!cabinet?.cabinet_id) {
                setCabinetCity({ name: 'Vitória', coords: cidadesCoordinates["vitória"] });
                return;
            }
            try {
                const { data: gabinete } = await supabase.from('gabinetes').select('id, camara_id').eq('id', cabinet.cabinet_id).single();
                if (gabinete?.camara_id) {
                    const { data: camara } = await supabase.from('camaras').select('nome, cidade_id').eq('id', gabinete.camara_id).single();
                    if (camara?.cidade_id) {
                        const { data: cidade } = await supabase.from('cidades').select('nome').eq('id', camara.cidade_id).single();
                        if (cidade?.nome) {
                            const cityName = cidade.nome.toLowerCase();
                            const coords = cidadesCoordinates[cityName] || cidadesCoordinates["vitória"];
                            setCabinetCity({ name: cidade.nome, coords });
                            return;
                        }
                    }
                }
                setCabinetCity({ name: 'Vitória', coords: cidadesCoordinates["vitória"] });
            } catch (error) {
                setCabinetCity({ name: 'Vitória', coords: cidadesCoordinates["vitória"] });
            }
        };
        fetchCabinetCity();
    }, [cabinet?.cabinet_id]);

    // Map eleitores to include coordinates logic if missing
    const mappedEleitores = (eleitores as any[]).map(e => ({
        ...e,
        lat: e.latitude || (cabinetCity?.coords[1] || -20.3) + (Math.random() - 0.5) * 0.05,
        lng: e.longitude || (cabinetCity?.coords[0] || -40.3) + (Math.random() - 0.5) * 0.05,
    }));

    const mappedIndicacoes = (indicacoes as any[]).map(i => ({
        ...i,
        lat: i.lat || i.latitude || (cabinetCity?.coords[1] || -20.3) + (Math.random() - 0.5) * 0.05,
        lng: i.lng || i.longitude || (cabinetCity?.coords[0] || -40.3) + (Math.random() - 0.5) * 0.05,
    }));

    const mappedDemandas = (demandas as any[]).map(d => ({
        ...d,
        lat: d.latitude || (cabinetCity?.coords[1] || -20.3) + (Math.random() - 0.5) * 0.05,
        lng: d.longitude || (cabinetCity?.coords[0] || -40.3) + (Math.random() - 0.5) * 0.05,
    }));

    return (
        <AppLayout>
            <div className="h-[calc(100vh-6rem)] p-4 md:p-8">
                <UnifiedMap
                    eleitores={mappedEleitores}
                    indicacoes={mappedIndicacoes}
                    demandas={mappedDemandas}
                    cabinetCity={cabinetCity}
                />
            </div>
        </AppLayout>
    );
};

export default Mapa;
