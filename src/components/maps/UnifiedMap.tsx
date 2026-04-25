import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Thermometer, Satellite, Map as MapIcon, Users, FileText, ClipboardList, Sparkles, Target, PencilRuler, Navigation, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin as MapPinType, MapRegional } from "@/hooks/useMapIntelligence";

// Types
export type MapMode = 'eleitores' | 'indicacoes' | 'demandas' | 'territorio';

interface UnifiedMapProps {
    eleitores: any[];
    indicacoes: any[];
    demandas: any[];
    pins: MapPinType[];
    regionals: MapRegional[];
    onAddPin: (lat: number, lng: number, comment: string) => Promise<any>;
    onDeletePin: (id: string) => Promise<void>;
    onAddRegional: (name: string, color: string, coordinates: [number, number][]) => Promise<any>;
    onDeleteRegional: (id: string) => Promise<void>;
    cabinetCity: { name: string; coords: [number, number] } | null;
    isGeocoding?: boolean;
}

export const UnifiedMap: React.FC<UnifiedMapProps> = ({
    eleitores,
    indicacoes,
    demandas,
    pins,
    regionals,
    onAddPin,
    onDeletePin,
    onAddRegional,
    onDeleteRegional,
    cabinetCity,
    isGeocoding = false
}) => {
    const { toast } = useToast();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const draw = useRef<any>(null);
    const [isMapInitialized, setIsMapInitialized] = useState(false);
    const [mode, setMode] = useState<MapMode>('territorio');
    const [searchTerm, setSearchTerm] = useState("");
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showMarkers, setShowMarkers] = useState(true);
    const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-v9');

    const [isAddingPin, setIsAddingPin] = useState(false);
    const [pinModalOpen, setPinModalOpen] = useState(false);
    const [tempCoords, setTempCoords] = useState<[number, number] | null>(null);
    const [pinComment, setPinComment] = useState("");

    const [regionalModalOpen, setRegionalModalOpen] = useState(false);
    const [tempRegionalCoords, setTempRegionalCoords] = useState<[number, number][] | null>(null);
    const [regionalName, setRegionalName] = useState("");
    const [regionalColor, setRegionalColor] = useState("#3b82f6");

    const [isStreetViewMode, setIsStreetViewMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isAddingPinRef = useRef(isAddingPin);
    const isStreetViewModeRef = useRef(isStreetViewMode);

    useEffect(() => {
        isAddingPinRef.current = isAddingPin;
        if (map.current) map.current.getCanvas().style.cursor = isAddingPin ? 'crosshair' : '';
    }, [isAddingPin]);

    useEffect(() => {
        isStreetViewModeRef.current = isStreetViewMode;
        if (map.current) map.current.getCanvas().style.cursor = isStreetViewMode ? 'crosshair' : '';
    }, [isStreetViewMode]);

    const currentData = useMemo(() => {
        const data = mode === 'territorio' ? [...eleitores, ...indicacoes, ...demandas] : 
                    mode === 'eleitores' ? eleitores : mode === 'indicacoes' ? indicacoes : demandas;
        return data.filter((item: any) => {
            const search = searchTerm.toLowerCase();
            return (item.name || item.titulo || "").toLowerCase().includes(search) ||
                   (item.address || item.endereco_rua || "").toLowerCase().includes(search);
        });
    }, [mode, eleitores, indicacoes, demandas, searchTerm]);

    const insights = useMemo(() => {
        const allData = [...eleitores, ...indicacoes, ...demandas];
        const neighborhoods: Record<string, number> = {};
        allData.forEach((item: any) => {
            const b = item.neighborhood || item.bairro || 'Não informado';
            if (b !== 'Não informado') neighborhoods[b] = (neighborhoods[b] || 0) + 1;
        });
        const sortedBairros = Object.entries(neighborhoods).sort((a, b) => b[1] - a[1]);
        const topNeighborhood = sortedBairros[0] || ['Nenhum', 0];
        let dominantType = "Equilibrado";
        if (topNeighborhood[0] !== 'Nenhum') {
            const eCount = eleitores.filter(e => (e.neighborhood || e.bairro) === topNeighborhood[0]).length;
            const aCount = [...indicacoes, ...demandas].filter(d => (d.neighborhood || d.bairro) === topNeighborhood[0]).length;
            dominantType = eCount > aCount ? "Base Eleitoral" : "Zona de Atendimento";
        }
        return {
            total: allData.length,
            topBairro: topNeighborhood[0],
            topBairroCount: topNeighborhood[1],
            dominantType,
            eleitoresCount: eleitores.length,
            indicacoesCount: indicacoes.length,
            demandasCount: demandas.length
        };
    }, [eleitores, indicacoes, demandas]);

    const setupUnifiedLayers = () => {
        if (!map.current) return;

        map.current.addLayer({
            id: 'data-heat',
            type: 'heatmap',
            source: 'unified-data',
            maxzoom: 15,
            paint: {
                'heatmap-weight': ['get', 'weight'],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 1, 15, 3],
                'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', 0.2, mode === 'eleitores' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(139, 92, 246, 0.5)', 1, mode === 'eleitores' ? '#3b82f6' : '#ffffff'],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 20, 15, 30]
            }
        });

        map.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'unified-data',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': ['step', ['get', 'point_count'], mode === 'eleitores' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(139, 92, 246, 0.8)', 50, 'rgba(236, 72, 153, 0.8)'],
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
                'text-field': '{point_count}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            },
            paint: { 'text-color': '#ffffff' }
        });

        map.current.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'unified-data',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-radius': 8,
                'circle-color': mode === 'eleitores' ? '#3b82f6' : ['match', ['get', 'status'], 'atendida', '#22c55e', 'pendente', '#eab308', 'resolvida', '#22c55e', '#8b5cf6'],
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#fff'
            }
        });

        map.current.addLayer({
            id: 'regionals-fill',
            type: 'fill',
            source: 'regionals-data',
            paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.2 }
        });

        map.current.addLayer({
            id: 'regionals-outline',
            type: 'line',
            source: 'regionals-data',
            paint: { 'line-color': ['get', 'color'], 'line-width': 2 }
        });

        map.current.addLayer({
            id: 'pins-layer',
            type: 'circle',
            source: 'pins-data',
            paint: { 'circle-radius': 10, 'circle-color': '#f59e0b', 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' }
        });

        const setCursor = (c: string) => { if (map.current) map.current.getCanvas().style.cursor = c; };
        ['unclustered-point', 'clusters', 'pins-layer', 'regionals-fill'].forEach(l => {
            map.current?.on('mouseenter', l, () => setCursor('pointer'));
            map.current?.on('mouseleave', l, () => setCursor(''));
        });
    };

    const updateMapLayers = () => {
        if (!map.current || !isMapInitialized) return;

        const geojsonData = {
            type: 'FeatureCollection',
            features: currentData.map((item: any) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [item.lng ?? item.longitude, item.lat ?? item.latitude]
                },
                properties: { ...item, mode, weight: mode === 'eleitores' ? 1 : 5 }
            })).filter(f => typeof f.geometry.coordinates[0] === 'number' && typeof f.geometry.coordinates[1] === 'number')
        };

        const source = map.current.getSource('unified-data') as mapboxgl.GeoJSONSource;
        if (source) {
            source.setData(geojsonData as any);
            
            // Update paint properties based on mode
            const circleColor = mode === 'eleitores' ? '#3b82f6' : ['match', ['get', 'status'], 'atendida', '#22c55e', 'pendente', '#eab308', 'resolvida', '#22c55e', '#8b5cf6'];
            const clusterColor = mode === 'eleitores' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(139, 92, 246, 0.8)';
            const heatmapColor = mode === 'eleitores' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)';
            const heatmapFinalColor = mode === 'eleitores' ? '#3b82f6' : '#ffffff';

            if (map.current.getLayer('unclustered-point')) {
                map.current.setPaintProperty('unclustered-point', 'circle-color', circleColor);
                map.current.setPaintProperty('unclustered-point', 'circle-opacity', 0.9);
            }
            if (map.current.getLayer('clusters')) {
                map.current.setPaintProperty('clusters', 'circle-color', ['step', ['get', 'point_count'], clusterColor, 50, 'rgba(236, 72, 153, 0.8)']);
                map.current.setPaintProperty('clusters', 'circle-opacity', 0.8);
            }
            if (map.current.getLayer('data-heat')) {
                map.current.setPaintProperty('data-heat', 'heatmap-color', ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', 0.2, heatmapColor, 1, heatmapFinalColor]);
            }
        } else {
            map.current.addSource('unified-data', {
                type: 'geojson',
                data: geojsonData as any,
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50
            });
            setupUnifiedLayers();
        }

        const regSource = map.current.getSource('regionals-data') as mapboxgl.GeoJSONSource;
        const regGeojson = {
            type: 'FeatureCollection',
            features: regionals.map(r => ({
                type: 'Feature',
                id: r.id,
                geometry: { type: 'Polygon', coordinates: [r.coordinates] },
                properties: { name: r.name, color: r.color }
            }))
        };
        if (regSource) regSource.setData(regGeojson as any);
        else map.current.addSource('regionals-data', { type: 'geojson', data: regGeojson as any });

        const pinsSource = map.current.getSource('pins-data') as mapboxgl.GeoJSONSource;
        const pinsGeojson = {
            type: 'FeatureCollection',
            features: pins.map(p => ({
                type: 'Feature',
                id: p.id,
                geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
                properties: { comment: p.comment }
            }))
        };
        if (pinsSource) pinsSource.setData(pinsGeojson as any);
        else map.current.addSource('pins-data', { type: 'geojson', data: pinsGeojson as any });
    };

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
        draw.current = new MapboxDraw({
            displayControlsDefault: false,
            controls: { polygon: true, trash: true },
            defaultMode: 'simple_select'
        });
        map.current.addControl(draw.current, 'top-right');

        map.current.on('load', () => {
            updateMapLayers();
            setIsMapInitialized(true);
        });

        map.current.on('draw.create', (e: any) => {
            setTempRegionalCoords(e.features[0].geometry.coordinates[0]);
            setRegionalModalOpen(true);
        });

        map.current.on('click', (e) => {
            if (isAddingPinRef.current) {
                setTempCoords([e.lngLat.lat, e.lngLat.lng]);
                setPinModalOpen(true);
                setIsAddingPin(false);
            } else if (isStreetViewModeRef.current) {
                window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${e.lngLat.lat},${e.lngLat.lng}`, '_blank');
                setIsStreetViewMode(false);
            }
        });
    };

    useEffect(() => {
        if (!cabinetCity) return;
        if (!isMapInitialized) initializeMap();
        else updateMapLayers();
    }, [cabinetCity, mode, currentData, pins, regionals, isMapInitialized]);

    useEffect(() => {
        if (!map.current || !cabinetCity) return;
        map.current.easeTo({ center: cabinetCity.coords, zoom: 12 });
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
            `}</style>
            <div ref={mapContainer} className="absolute inset-0" />
            
            <div className="absolute top-6 inset-x-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pointer-events-none">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto pointer-events-auto">
                    <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-1 rounded-2xl flex gap-1">
                        {(['eleitores', 'indicacoes', 'demandas', 'territorio'] as MapMode[]).map(m => (
                          <button key={m} onClick={() => setMode(m)} className={cn("h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", mode === m ? "bg-primary text-white" : "text-white/40 hover:text-white/60")}>
                            {m === 'eleitores' && <Users className="w-3.5 h-3.5 inline mr-2" />}
                            {m === 'indicacoes' && <FileText className="w-3.5 h-3.5 inline mr-2" />}
                            {m === 'demandas' && <ClipboardList className="w-3.5 h-3.5 inline mr-2" />}
                            {m === 'territorio' && <Target className="w-3.5 h-3.5 inline mr-2" />}
                            {m}
                          </button>
                        ))}
                    </div>
                    <div className="relative min-w-[250px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                        <Input placeholder="Buscar no mapa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-11 h-12 bg-black/40 backdrop-blur-2xl border-white/10 text-white rounded-2xl placeholder:text-white/20" />
                    </div>
                </div>
                <div className="pointer-events-auto">
                    <Badge className="h-10 px-4 bg-primary text-white rounded-xl border-none font-black uppercase text-[10px] tracking-wider">{currentData.length} MAPEADOS</Badge>
                </div>
            </div>

            <div className="absolute bottom-8 left-8 flex flex-col gap-3 pointer-events-auto">
                <div className="p-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col gap-1">
                    <Button variant="ghost" size="sm" onClick={changeMapStyle} className={cn("h-10 w-10 p-0 rounded-xl", mapStyle.includes('satellite') ? "bg-primary/20 text-primary" : "text-white/60")}><Satellite className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsStreetViewMode(!isStreetViewMode)} className={cn("h-10 w-10 p-0 rounded-xl", isStreetViewMode ? "bg-emerald-500/20 text-emerald-500" : "text-white/60")}><Navigation className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsAddingPin(!isAddingPin)} className={cn("h-10 w-10 p-0 rounded-xl", isAddingPin ? "bg-primary text-white" : "text-white/60")}><MapPin className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => draw.current?.changeMode('draw_polygon')} className="h-10 w-10 p-0 rounded-xl text-white/60"><PencilRuler className="w-5 h-5" /></Button>
                    <div className="h-px bg-white/10 my-1 mx-2" />
                    <Button variant="ghost" size="sm" onClick={toggleHeatmap} className={cn("h-10 w-10 p-0 rounded-xl", showHeatmap ? "bg-amber-500/20 text-amber-500" : "text-white/60")}><Thermometer className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="sm" onClick={toggleMarkers} className={cn("h-10 w-10 p-0 rounded-xl", showMarkers ? "bg-blue-500/20 text-blue-500" : "text-white/60")}><MapIcon className="w-5 h-5" /></Button>
                </div>
            </div>

            <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
                <DialogContent className="glass bg-black/90 text-white border-white/10">
                    <DialogHeader><DialogTitle className="font-black uppercase tracking-tight font-outfit">Adicionar Pino Estratégico</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Comentário / Observação</Label>
                        <Input value={pinComment} onChange={(e) => setPinComment(e.target.value)} placeholder="Digite sua nota técnica..." className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPinModalOpen(false)} className="text-white/50">Cancelar</Button>
                        <Button disabled={!pinComment || isSaving} onClick={async () => { if (tempCoords) { setIsSaving(true); await onAddPin(tempCoords[0], tempCoords[1], pinComment); setIsSaving(false); setPinModalOpen(false); setPinComment(""); } }} className="bg-primary text-white font-black uppercase tracking-widest text-[10px] px-8">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Pino"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={regionalModalOpen} onOpenChange={setRegionalModalOpen}>
                <DialogContent className="glass bg-black/90 text-white border-white/10">
                    <DialogHeader><DialogTitle className="font-black uppercase tracking-tight font-outfit">Criar Regional</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Nome da Regional</Label>
                        <Input value={regionalName} onChange={(e) => setRegionalName(e.target.value)} placeholder="Ex: Regional Centro..." className="bg-white/5 border-white/10 text-white" />
                        <div className="flex gap-2 mt-4">
                            {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                                <button key={c} onClick={() => setRegionalColor(c)} className={cn("w-10 h-10 rounded-xl border-2 transition-all", regionalColor === c ? "border-white scale-110" : "border-transparent opacity-50")} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setRegionalModalOpen(false); draw.current?.deleteAll(); }} className="text-white/50">Descartar</Button>
                        <Button disabled={!regionalName || isSaving} onClick={async () => { if (tempRegionalCoords) { setIsSaving(true); await onAddRegional(regionalName, regionalColor, tempRegionalCoords); setIsSaving(false); setRegionalModalOpen(false); setRegionalName(""); draw.current?.deleteAll(); } }} className="bg-primary text-white font-black uppercase tracking-widest text-[10px] px-8">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Regional"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="absolute bottom-8 right-8 bg-black/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 w-72 shadow-2xl pointer-events-auto">
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary" /> Insights</div>
                    {isGeocoding && <div className="flex items-center gap-1 text-[8px] text-primary animate-pulse"><Loader2 className="w-2.5 h-2.5 animate-spin" /> Geocodificando...</div>}
                </h4>
                <div className="space-y-4">
                    <div>
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter mb-1">Domínio Territorial</p>
                        <p className="text-sm font-black text-white uppercase truncate">{insights.topBairro}</p>
                        <Badge variant="outline" className="mt-1 text-[8px] border-primary/20 text-primary font-black">{insights.dominantType}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                        <div className="text-center"><p className="text-[9px] text-white/30 uppercase font-bold">Eleitores</p><p className="text-sm font-black text-white">{insights.eleitoresCount}</p></div>
                        <div className="text-center"><p className="text-[9px] text-white/30 uppercase font-bold">Ações</p><p className="text-sm font-black text-white">{insights.indicacoesCount + insights.demandasCount}</p></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
