import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { UnifiedMap } from "@/components/maps/UnifiedMap";
import { useEleitoresWithStats } from "@/hooks/useEleitoresWithStats";
import { useRealIndicacoes } from "@/hooks/useRealIndicacoes";
import { useRealDemandas } from "@/hooks/useRealDemandas";
import { useAuthContext } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useMapIntelligence } from "@/hooks/useMapIntelligence";

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
    const { pins, regionals, addPin, deletePin, addRegional, deleteRegional } = useMapIntelligence();
    const [cabinetCity, setCabinetCity] = useState<{ name: string; coords: [number, number] }>({
        name: "Vitória",
        coords: cidadesCoordinates["vitória"],
    });

    const [geocodedData, setGeocodedData] = useState<{
        eleitores: any[],
        indicacoes: any[],
        demandas: any[]
    }>({ eleitores: [], indicacoes: [], demandas: [] });

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

    const [isGeocoding, setIsGeocoding] = useState(false);

    // Geocoding logic
    useEffect(() => {
        const geocodeAll = async () => {
            const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
            if (!token) return;

            setIsGeocoding(true);
            const processCollection = async (items: any[], type: string) => {
                return Promise.all(items.map(async (item) => {
                    // Already has coords
                    if (item.latitude && item.longitude) {
                        return { ...item, lat: item.latitude, lng: item.longitude };
                    }
                    if (item.lat && item.lng) return item;

                    // Needs geocoding
                    const address = item.address || item.endereco_rua || item.neighborhood || item.bairro;
                    if (address) {
                        try {
                            const query = `${address}, ${cabinetCity.name}`;
                            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`);
                            const json = await res.json();
                            if (json.features?.[0]) {
                                const [lng, lat] = json.features[0].center;
                                return { ...item, lat, lng, isGeocoded: true };
                            }
                        } catch (e) {
                            console.error("Geocoding error:", e);
                        }
                    }

                    // Fallback to city center (approximate) to avoid disappearing
                    return { 
                        ...item, 
                        lat: cabinetCity.coords[1] + (Math.random() - 0.5) * 0.01, 
                        lng: cabinetCity.coords[0] + (Math.random() - 0.5) * 0.01,
                        isApproximate: true 
                    };
                }));
            };

            const [geoEleitores, geoIndicacoes, geoDemandas] = await Promise.all([
                processCollection(eleitores || [], 'eleitores'),
                processCollection(indicacoes || [], 'indicacoes'),
                processCollection(demandas || [], 'demandas')
            ]);

            setGeocodedData({
                eleitores: geoEleitores,
                indicacoes: geoIndicacoes,
                demandas: geoDemandas
            });
            setIsGeocoding(false);
        };

        if ((eleitores?.length || indicacoes?.length || demandas?.length) && cabinetCity.coords) {
            geocodeAll();
        }
    }, [eleitores, indicacoes, demandas, cabinetCity]);

    return (
        <AppLayout>
            <div className="h-[calc(100vh-6rem)] p-4 md:p-8">
                <UnifiedMap
                    eleitores={geocodedData.eleitores}
                    indicacoes={geocodedData.indicacoes}
                    demandas={geocodedData.demandas}
                    pins={pins}
                    regionals={regionals}
                    onAddPin={addPin}
                    onDeletePin={deletePin}
                    onAddRegional={addRegional}
                    onDeleteRegional={deleteRegional}
                    cabinetCity={cabinetCity}
                    isGeocoding={isGeocoding}
                />
            </div>
        </AppLayout>
    );
};

export default Mapa;
