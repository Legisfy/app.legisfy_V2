import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Thermometer, Satellite, Map, Filter, Users, FileText, ClipboardList, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
export type MapMode = 'eleitores' | 'indicacoes' | 'demandas' | 'territorio';

interface UnifiedMapProps {
    eleitores: any[];
    indicacoes: any[];
    demandas: any[];
    cabinetCity: { name: string; coords: [number, number] } | null;
}

export const UnifiedMap: React.FC<UnifiedMapProps> = ({
    eleitores,
    indicacoes,
    demandas,
    cabinetCity
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [isMapInitialized, setIsMapInitialized] = useState(false);
    const [mode, setMode] = useState<MapMode>('indicacoes');
    const [searchTerm, setSearchTerm] = useState("");
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showMarkers, setShowMarkers] = useState(true);
    const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/navigation-night-v1');

    // Filter data based on mode and search
    const currentData = useMemo(() => {
        if (mode === 'territorio') {
            // For territory, we combine everything to show dominance
            return [...eleitores, ...indicacoes, ...demandas];
        }
        const data = mode === 'eleitores' ? eleitores : mode === 'indicacoes' ? indicacoes : demandas;
        return data.filter((item: any) => {
            const name = item.name || item.titulo || item.title || "";
            const description = item.descricao || item.description || "";
            const address = item.address || item.endereco_rua || "";
            const search = searchTerm.toLowerCase();
            return name.toLowerCase().includes(search) ||
                description.toLowerCase().includes(search) ||
                address.toLowerCase().includes(search);
        });
    }, [mode, eleitores, indicacoes, demandas, searchTerm]);

    // Aggregate data by neighborhood for insights
    const insights = useMemo(() => {
        const allData = [...eleitores, ...indicacoes, ...demandas];
        const neighborhoods: Record<string, number> = {};

        allData.forEach((item: any) => {
            const b = item.bairro || 'Não informado';
            neighborhoods[b] = (neighborhoods[b] || 0) + 1;
        });

        const topNeighborhood = Object.entries(neighborhoods)
            .sort((a, b) => b[1] - a[1])[0] || ['Nenhum', 0];

        return {
            total: allData.length,
            topBairro: topNeighborhood[0],
            topBairroCount: topNeighborhood[1],
            eleitoresCount: eleitores.length,
            indicacoesCount: indicacoes.length,
            demandasCount: demandas.length
        };
    }, [eleitores, indicacoes, demandas]);

    const initializeMap = () => {
        if (!mapContainer.current || isMapInitialized || !cabinetCity) return;
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center: cabinetCity.coords,
            zoom: 12,
            pitch: 45,
            attributionControl: false
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.on('load', () => {
            updateMapLayers();
            setIsMapInitialized(true);
        });
    };

    const updateMapLayers = () => {
        if (!map.current) return;

        // Remove existing layers and sources to switch modes
        const layers = ['clusters', 'cluster-count', 'unclustered-point', 'data-heat'];
        layers.forEach(layer => {
            if (map.current?.getLayer(layer)) map.current.removeLayer(layer);
        });
        if (map.current.getSource('unified-data')) map.current.removeSource('unified-data');

        const geojsonData = {
            type: 'FeatureCollection',
            features: currentData.map((item: any) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [item.lng || item.longitude, item.lat || item.latitude]
                },
                properties: {
                    ...item,
                    mode,
                    weight: mode === 'eleitores' ? 1 : 5 // Weight for heatmap
                }
            })).filter(f => f.geometry.coordinates[0] && f.geometry.coordinates[1])
        };

        map.current.addSource('unified-data', {
            type: 'geojson',
            data: geojsonData as any,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
        });

        // Heatmap
        map.current.addLayer({
            id: 'data-heat',
            type: 'heatmap',
            source: 'unified-data',
            maxzoom: 15,
            layout: { visibility: showHeatmap ? 'visible' : 'none' },
            paint: {
                'heatmap-weight': ['get', 'weight'],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 1, 15, 3],
                'heatmap-color': [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(0,0,0,0)',
                    0.2, mode === 'eleitores' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                    1, mode === 'eleitores' ? '#3b82f6' : '#ffffff'
                ],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 20, 15, 30]
            }
        });

        // Clusters
        map.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'unified-data',
            filter: ['has', 'point_count'],
            layout: { visibility: showMarkers ? 'visible' : 'none' },
            paint: {
                'circle-color': [
                    'step', ['get', 'point_count'],
                    mode === 'eleitores' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(139, 92, 246, 0.4)',
                    50, 'rgba(236, 72, 153, 0.4)'
                ],
                'circle-radius': ['step', ['get', 'point_count'], 25, 20, 35, 50, 45],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff',
                'circle-blur': 0.1
            }
        });

        map.current.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'unified-data',
            filter: ['has', 'point_count'],
            layout: {
                visibility: showMarkers ? 'visible' : 'none',
                'text-field': '{point_count}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            },
            paint: { 'text-color': '#ffffff' }
        });

        // Unclustered Points
        map.current.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'unified-data',
            filter: ['!', ['has', 'point_count']],
            layout: { visibility: showMarkers ? 'visible' : 'none' },
            paint: {
                'circle-radius': 8,
                'circle-color': mode === 'eleitores' ? '#3b82f6' :
                    ['match', ['get', 'status'],
                        'atendida', '#22c55e',
                        'pendente', '#eab308',
                        'resolvida', '#22c55e',
                        '#8b5cf6'],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff',
                'circle-emissive-strength': 1
            }
        });

        // Popups
        map.current.on('click', 'unclustered-point', (e) => {
            if (!e.features?.[0]) return;
            const props = e.features[0].properties;
            const coords = (e.features[0].geometry as any).coordinates.slice();

            const title = props.name || props.titulo || props.title || 'Sem título';
            const detail = props.bairro || props.endereco_rua || 'Localização não informada';
            const status = props.status ? props.status.toUpperCase() : (mode === 'eleitores' ? 'ELEITOR' : (props.mode === 'eleitores' ? 'ELEITOR' : 'DADO'));
            const color = (props.mode || mode) === 'eleitores' ? '#3b82f6' : '#8b5cf6';

            new mapboxgl.Popup({ className: 'glass-popup', closeButton: false, maxWidth: '300px' })
                .setLngLat(coords)
                .setHTML(`
          <div class="p-4 bg-black/80 backdrop-blur-xl border border-white/5 rounded-2xl text-white shadow-2xl">
            <h3 class="font-black text-lg mb-1 font-outfit uppercase tracking-tight">${title}</h3>
            <p class="text-[10px] text-white/50 mb-3 uppercase tracking-widest">${detail}</p>
            <div class="flex items-center gap-2 mb-4">
              <span class="text-[9px] font-black px-2 py-0.5 rounded-full border border-white/5" style="background-color: ${color}40; color: ${color}">${status}</span>
            </div>
            <p class="text-[11px] text-white/60 leading-relaxed">${props.descricao || props.description || 'Sem detalhes adicionais.'}</p>
          </div>
        `).addTo(map.current!);
        });

        // Helper for clustering clicks
        map.current.on('click', 'clusters', (e) => {
            const features = map.current?.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            const clusterId = features?.[0].properties?.cluster_id;
            (map.current?.getSource('unified-data') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (!err) map.current?.easeTo({ center: (features?.[0].geometry as any).coordinates, zoom: zoom! });
            });
        });

        const setCursor = (c: string) => { if (map.current) map.current.getCanvas().style.cursor = c; };
        ['unclustered-point', 'clusters'].forEach(l => {
            map.current?.on('mouseenter', l, () => setCursor('pointer'));
            map.current?.on('mouseleave', l, () => setCursor(''));
        });
    };

    useEffect(() => {
        if (!cabinetCity) return;
        if (!isMapInitialized) {
            initializeMap();
        } else {
            updateMapLayers();
        }
    }, [cabinetCity, mode, currentData, isMapInitialized]);

    useEffect(() => {
        if (!map.current || !cabinetCity) return;
        map.current.easeTo({
            center: cabinetCity.coords,
            zoom: 12,
        });
    }, [cabinetCity?.coords[0], cabinetCity?.coords[1]]);

    const toggleHeatmap = () => {
        if (!map.current) return;
        const v = showHeatmap ? 'none' : 'visible';
        if (map.current.getLayer('data-heat')) map.current.setLayoutProperty('data-heat', 'visibility', v);
        setShowHeatmap(!showHeatmap);
    };

    const toggleMarkers = () => {
        if (!map.current) return;
        const v = showMarkers ? 'none' : 'visible';
        ['unclustered-point', 'clusters', 'cluster-count'].forEach(l => {
            if (map.current?.getLayer(l)) map.current.setLayoutProperty(l, 'visibility', v);
        });
        setShowMarkers(!showMarkers);
    };

    const changeMapStyle = () => {
        if (!map.current) return;
        const newStyle = mapStyle.includes('satellite') ? 'mapbox://styles/mapbox/navigation-night-v1' : 'mapbox://styles/mapbox/satellite-v9';
        map.current.setStyle(newStyle);
        setMapStyle(newStyle);
        map.current.once('styledata', () => updateMapLayers());
    };

    return (
        <div className="h-full relative overflow-hidden bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 shadow-2xl group/map">
            <style>{`
                .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { display: none !important; }
                .mapboxgl-canvas { filter: saturate(0.8) contrast(1.1) brightness(0.9); outline: none !important; }
                .glass-popup .mapboxgl-popup-content { background: transparent; border: none; padding: 0; box-shadow: none; }
                .glass-popup .mapboxgl-popup-tip { border-top-color: rgba(0,0,0,0.8); }
            `}</style>
            <div ref={mapContainer} className="absolute inset-0" />
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

            {/* TOP CONTROLS */}
            <div className="absolute top-6 inset-x-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pointer-events-none">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto pointer-events-auto">
                    {/* MODO TABS */}
                    <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-1 rounded-2xl flex gap-1">
                        <button
                            onClick={() => setMode('eleitores')}
                            className={cn("h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2", mode === 'eleitores' ? "bg-primary text-white" : "text-white/40 hover:text-white/60")}
                        >
                            <Users className="w-3.5 h-3.5" /> Eleitores
                        </button>
                        <button
                            onClick={() => setMode('indicacoes')}
                            className={cn("h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2", mode === 'indicacoes' ? "bg-primary text-white" : "text-white/40 hover:text-white/60")}
                        >
                            <FileText className="w-3.5 h-3.5" /> Indicações
                        </button>
                        <button
                            onClick={() => setMode('demandas')}
                            className={cn("h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2", mode === 'demandas' ? "bg-primary text-white" : "text-white/40 hover:text-white/60")}
                        >
                            <ClipboardList className="w-3.5 h-3.5" /> Demandas
                        </button>
                        <button
                            onClick={() => setMode('territorio')}
                            className={cn("h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2", mode === 'territorio' ? "bg-primary text-white" : "text-white/40 hover:text-white/60")}
                        >
                            <Target className="w-3.5 h-3.5" /> Domínio
                        </button>
                    </div>

                    <div className="relative group min-w-[250px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                        <Input
                            placeholder="Buscar no mapa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 h-12 bg-black/40 backdrop-blur-2xl border-white/10 text-white rounded-2xl placeholder:text-white/20"
                        />
                    </div>
                </div>

                <div className="pointer-events-auto">
                    <Badge className="h-10 px-4 bg-primary text-white rounded-xl border-none shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-wider">
                        {currentData.length} {mode.toUpperCase()} MAPEADOS
                    </Badge>
                </div>
            </div>

            {/* BOTTOM LEFT CONTROLS */}
            <div className="absolute bottom-8 left-8 flex flex-col gap-3 pointer-events-auto">
                <div className="p-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col gap-1">
                    <Button variant="ghost" size="sm" onClick={changeMapStyle} className={cn("h-10 w-10 p-0 rounded-xl", mapStyle.includes('satellite') ? "bg-primary/20 text-primary" : "text-white/60")}><Satellite className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="sm" onClick={toggleHeatmap} className={cn("h-10 w-10 p-0 rounded-xl", showHeatmap ? "bg-amber-500/20 text-amber-500" : "text-white/60")}><Thermometer className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="sm" onClick={toggleMarkers} className={cn("h-10 w-10 p-0 rounded-xl", showMarkers ? "bg-blue-500/20 text-blue-500" : "text-white/60")}><Map className="w-5 h-5" /></Button>
                </div>
            </div>

            {/* INSIGHTS REPORT CARD */}
            <div className="absolute bottom-8 right-8 bg-black/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 w-72 shadow-2xl pointer-events-auto overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full -mr-16 -mt-16" />

                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Relatório de Insights
                </h4>

                <div className="space-y-5 relative z-10">
                    <div>
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter mb-1">Domínio Territorial</p>
                        <div className="flex items-end justify-between">
                            <span className="text-sm font-black text-white uppercase truncate max-w-[150px]">{insights.topBairro}</span>
                            <Badge variant="outline" className="text-[9px] border-primary/20 text-primary bg-primary/5">+{insights.topBairroCount}</Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                        <div>
                            <p className="text-[9px] text-white/30 uppercase font-bold mb-0.5">Eleitores</p>
                            <p className="text-sm font-black text-white">{insights.eleitoresCount}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-white/30 uppercase font-bold mb-0.5">Ações</p>
                            <p className="text-sm font-black text-white">{insights.indicacoesCount + insights.demandasCount}</p>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                        <p className="text-[10px] text-white/80 leading-tight">
                            {mode === 'territorio'
                                ? `Você possui maior concentração de dados no bairro ${insights.topBairro}, representando uma zona de forte influência.`
                                : `Visualizando ${currentData.length} registros ativos. O bairro ${insights.topBairro} lidera o volume de interações.`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
