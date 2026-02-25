import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Thermometer, Satellite, Map, Filter, Tag } from "lucide-react";
import { useAuthContext } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// CSS customizado para o popup
const popupStyles = `
  <style>
    .mapboxgl-popup-content {
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
    .mapboxgl-popup-tip {
      border-top-color: rgba(0,0,0,0.6) !important;
    }
    .glass-popup .mapboxgl-popup-content {
      backdrop-filter: blur(16px);
      border-radius: 20px;
    }
  </style>
`;

interface Indicacao {
  id: string;
  titulo?: string;
  title?: string;
  descricao?: string;
  description?: string;
  endereco_rua?: string;
  endereco_bairro?: string;
  endereco_cep?: string;
  address?: string;
  tags?: string[];
  status: "criada" | "formalizada" | "protocolada" | "pendente" | "atendida";
  requestedByVoter?: boolean;
  voterId?: string;
  voterName?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  user_id?: string;
  created_at?: string;
  fotos_urls?: string[];
}

interface IndicacoesMapProps {
  indicacoes: Indicacao[];
  onIndicacaoClick?: (indicacao: Indicacao) => void;
}

// Coordenadas das principais cidades brasileiras
const cidadesCoordinates: { [key: string]: [number, number] } = {
  "rio branco": [-67.8243, -9.9753],
  "maceió": [-35.7351, -9.6658],
  "macapá": [-51.0694, 0.0389],
  "manaus": [-60.0251, -3.1190],
  "salvador": [-38.5014, -12.9714],
  "fortaleza": [-38.5267, -3.7319],
  "brasília": [-47.8825, -15.7942],
  "vitória": [-40.2976, -20.2976],
  "goiânia": [-49.2532, -16.6869],
  "são luís": [-44.3018, -2.5307],
  "cuiabá": [-56.0882, -15.6014],
  "campo grande": [-54.6464, -20.4697],
  "belo horizonte": [-43.9378, -19.9208],
  "belém": [-48.5044, -1.4558],
  "joão pessoa": [-34.8641, -7.1195],
  "curitiba": [-49.2731, -25.4284],
  "recife": [-34.8955, -8.0578],
  "teresina": [-42.8034, -5.0892],
  "rio de janeiro": [-43.1729, -22.9068],
  "natal": [-35.2094, -5.7945],
  "porto alegre": [-51.2287, -30.0346],
  "porto velho": [-63.9004, -8.7619],
  "boa vista": [-60.6753, 2.8235],
  "florianópolis": [-48.5482, -27.5954],
  "são paulo": [-46.6388, -23.5505],
  "aracaju": [-37.0721, -10.9472],
  "palmas": [-48.3558, -10.1689],
};

export const IndicacoesMap: React.FC<IndicacoesMapProps> = ({
  indicacoes,
  onIndicacaoClick
}) => {
  const { cabinet } = useAuthContext();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [selectedBairro, setSelectedBairro] = useState("todos");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/navigation-night-v1');
  const [cabinetCity, setCabinetCity] = useState<{ name: string; coords: [number, number] } | null>(null);
  const [usersCache, setUsersCache] = useState<{ [key: string]: { nome: string } }>({});
  const [geocodingCache, setGeocodingCache] = useState<{ [key: string]: [number, number] }>({});

  useEffect(() => {
    const fetchCabinetCity = async () => {
      if (!cabinet?.cabinet_id) {
        setCabinetCity({ name: 'São Paulo', coords: cidadesCoordinates["são paulo"] });
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
              const coords = cidadesCoordinates[cityName] || cidadesCoordinates["são paulo"];
              setCabinetCity({ name: cidade.nome, coords });
              return;
            }
          }
        }
        setCabinetCity({ name: 'São Paulo', coords: cidadesCoordinates["são paulo"] });
      } catch (error) {
        setCabinetCity({ name: 'São Paulo', coords: cidadesCoordinates["são paulo"] });
      }
    };
    fetchCabinetCity();
  }, [cabinet?.cabinet_id]);

  const bairrosUnicos = useMemo(() => {
    const bairros = indicacoes.map(ind => {
      const address = ind.endereco_rua || ind.address || '';
      return address.split(',')[1]?.trim() || 'Outros';
    }).filter(Boolean);
    return Array.from(new Set(bairros)).sort();
  }, [indicacoes]);

  const geocodeAddress = async (indicacao: Indicacao): Promise<[number, number] | null> => {
    const ruaRaw = (indicacao.endereco_rua || '').trim();
    const bairro = (indicacao.endereco_bairro || '').trim();
    const cidade = (cabinetCity?.name || 'Vitória').trim();
    if (!ruaRaw) return null;
    const query = `${ruaRaw}, ${bairro}, ${cidade}, Brasil`;
    if (geocodingCache[query]) return geocodingCache[query];
    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}&limit=1`);
      if (response.ok) {
        const data = await response.json();
        if (data.features?.length) {
          const coords = data.features[0].center as [number, number];
          setGeocodingCache(prev => ({ ...prev, [query]: coords }));
          return coords;
        }
      }
    } catch (e) { }
    return null;
  };

  const indicacoesWithCoords = useMemo(() => {
    return indicacoes.map(indicacao => {
      const lat = indicacao.lat || indicacao.latitude || (cabinetCity?.coords[1] || -23.55) + (Math.random() - 0.5) * 0.01;
      const lng = indicacao.lng || indicacao.longitude || (cabinetCity?.coords[0] || -46.63) + (Math.random() - 0.5) * 0.01;
      return { ...indicacao, lat: Number(lat), lng: Number(lng) };
    });
  }, [indicacoes, cabinetCity]);

  const filteredIndicacoes = useMemo(() => {
    return indicacoesWithCoords.filter(indicacao => {
      const text = `${indicacao.titulo} ${indicacao.descricao} ${indicacao.endereco_rua}`.toLowerCase();
      const matchesSearch = text.includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === "todos" || indicacao.status === selectedStatus;
      const matchesBairro = selectedBairro === "todos" || (indicacao.endereco_bairro || '').toLowerCase().includes(selectedBairro.toLowerCase());
      return matchesSearch && matchesStatus && matchesBairro;
    });
  }, [indicacoesWithCoords, searchTerm, selectedStatus, selectedBairro]);

  const initializeMap = () => {
    if (!mapContainer.current || isMapInitialized || !cabinetCity) return;
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: cabinetCity.coords,
      zoom: 11,
      pitch: 45
    });
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.on('load', () => {
      addIndicacoesData();
      setIsMapInitialized(true);
    });
  };

  const addIndicacoesData = () => {
    if (!map.current) return;
    const geojsonData = {
      type: 'FeatureCollection',
      features: filteredIndicacoes.map(ind => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [ind.lng!, ind.lat!] },
        properties: { ...ind, weight: getStatusWeight(ind.status) }
      }))
    };

    if (!map.current.getSource('indicacoes')) {
      map.current.addSource('indicacoes', {
        type: 'geojson',
        data: geojsonData as any,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });
    }

    map.current.addLayer({
      id: 'indicacoes-heat',
      type: 'heatmap',
      source: 'indicacoes',
      maxzoom: 15,
      paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 1, 15, 3],
        'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', 0.2, 'rgba(59, 130, 246, 0.2)', 0.4, 'rgba(139, 92, 246, 0.4)', 0.6, 'rgba(236, 72, 153, 0.6)', 0.8, 'rgba(255, 255, 255, 0.8)', 1, '#ffffff'],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 20, 15, 30]
      }
    });

    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'indicacoes',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], 'rgba(59, 130, 246, 0.4)', 5, 'rgba(139, 92, 246, 0.4)', 15, 'rgba(236, 72, 153, 0.4)'],
        'circle-radius': ['step', ['get', 'point_count'], 25, 5, 35, 15, 45],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-blur': 0.1
      }
    });

    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'indicacoes',
      filter: ['has', 'point_count'],
      layout: { 'text-field': '{point_count}', 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'], 'text-size': 12 },
      paint: { 'text-color': '#ffffff' }
    });

    map.current.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'indicacoes',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': 8,
        'circle-color': ['match', ['get', 'status'], 'atendida', '#22c55e', 'pendente', '#eab308', 'protocolada', '#f59e0b', 'formalizada', '#8b5cf6', '#3b82f6'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-emissive-strength': 1
      }
    });

    map.current.on('click', 'unclustered-point', async (e) => {
      if (!e.features?.[0]) return;
      const props = e.features[0].properties;
      const coordinates = (e.features[0].geometry as any).coordinates.slice();

      const statusColor = getStatusColor(props.status);
      const statusLabel = getStatusLabel(props.status);
      const streetViewUrl = `https://maps.google.com/maps?q=&layer=c&cbll=${coordinates[1]},${coordinates[0]}`;

      new mapboxgl.Popup({ className: 'glass-popup', closeButton: false, maxWidth: '300px' })
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-2xl">
            <h3 class="font-black text-lg mb-1 font-outfit uppercase tracking-tight">${props.titulo || 'Sem título'}</h3>
            <p class="text-[10px] text-white/50 mb-3 uppercase tracking-widest">${props.endereco_rua || 'Localização não informada'}</p>
            <div class="flex items-center gap-2 mb-4">
              <span class="text-[9px] font-black px-2 py-0.5 rounded-full border border-white/5" style="background-color: ${statusColor}40; color: ${statusColor}">${statusLabel}</span>
            </div>
            <p class="text-[11px] text-white/60 leading-relaxed mb-4 line-clamp-3">${props.descricao || 'Sem descrição.'}</p>
            <div class="grid grid-cols-2 gap-2">
              <button onclick="window.open('${streetViewUrl}', '_blank')" class="bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest h-9 rounded-lg border border-white/5 flex items-center justify-center gap-1.5">📍 Street View</button>
              <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}', '_blank')" class="bg-primary hover:brightness-110 text-white text-[9px] font-black uppercase tracking-widest h-9 rounded-lg flex items-center justify-center gap-1.5">Navegar</button>
            </div>
          </div>
        `).addTo(map.current!);
    });

    map.current.on('click', 'clusters', (e) => {
      const features = map.current?.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = features?.[0].properties?.cluster_id;
      (map.current?.getSource('indicacoes') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (!err) map.current?.easeTo({ center: (features?.[0].geometry as any).coordinates, zoom: zoom! });
      });
    });

    const setCursor = (c: string) => { if (map.current) map.current.getCanvas().style.cursor = c; };
    map.current.on('mouseenter', 'unclustered-point', () => setCursor('pointer'));
    map.current.on('mouseleave', 'unclustered-point', () => setCursor(''));
    map.current.on('mouseenter', 'clusters', () => setCursor('pointer'));
    map.current.on('mouseleave', 'clusters', () => setCursor(''));
  };

  const updateIndicacoesData = () => {
    if (!map.current) return;
    const source = map.current.getSource('indicacoes') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: filteredIndicacoes.map(ind => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [ind.lng!, ind.lat!] },
          properties: { ...ind, weight: getStatusWeight(ind.status) }
        }))
      });
    }
  };

  useEffect(() => { if (isMapInitialized) updateIndicacoesData(); }, [filteredIndicacoes, isMapInitialized]);
  useEffect(() => { if (cabinetCity && !isMapInitialized) initializeMap(); }, [cabinetCity, isMapInitialized]);

  const getStatusWeight = (s: string) => {
    switch (s) { case "pendente": return 5; case "protocolada": return 4; case "formalizada": return 3; case "criada": return 2; case "atendida": return 1; default: return 1; }
  };
  const getStatusColor = (s: string) => {
    switch (s) { case "criada": return "#3b82f6"; case "formalizada": return "#8b5cf6"; case "protocolada": return "#f59e0b"; case "pendente": return "#eab308"; case "atendida": return "#22c55e"; default: return "#6b7280"; }
  };
  const getStatusLabel = (s: string) => {
    switch (s) { case "criada": return "Criada"; case "formalizada": return "Formalizada"; case "protocolada": return "Protocolada"; case "pendente": return "Pendente"; case "atendida": return "Atendida"; default: return "Desconhecido"; }
  };

  const toggleHeatmap = () => {
    if (!map.current) return;
    const v = showHeatmap ? 'none' : 'visible';
    if (map.current.getLayer('indicacoes-heat')) map.current.setLayoutProperty('indicacoes-heat', 'visibility', v);
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
    map.current.once('styledata', () => addIndicacoesData());
  };

  return (
    <div className="h-full relative overflow-hidden bg-zinc-950 rounded-[2.5rem] border border-white/5 shadow-2xl">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      <div className="absolute top-6 inset-x-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pointer-events-none">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto pointer-events-auto">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <Input
              placeholder="Buscar indicação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 bg-black/40 backdrop-blur-2xl border-white/10 text-white rounded-2xl placeholder:text-white/20"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-12 bg-black/40 backdrop-blur-2xl border-white/10 text-white rounded-2xl w-[150px]">
                <Filter className="w-4 h-4 mr-2 text-primary" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="criada">Criada</SelectItem>
                <SelectItem value="formalizada">Formalizada</SelectItem>
                <SelectItem value="protocolada">Protocolada</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="atendida">Atendida</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedBairro} onValueChange={setSelectedBairro}>
              <SelectTrigger className="h-12 bg-black/40 backdrop-blur-2xl border-white/10 text-white rounded-2xl w-[180px]">
                <MapPin className="w-4 h-4 mr-2 text-amber-500" />
                <SelectValue placeholder="Região" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="todos">Todas Regiões</SelectItem>
                {bairrosUnicos.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="pointer-events-auto">
          <Badge className="h-10 px-4 bg-primary text-white rounded-xl border-none shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-wider">
            {filteredIndicacoes.length} Demandas Mapeadas
          </Badge>
        </div>
      </div>

      <div className="absolute bottom-8 left-8 flex flex-col gap-3 pointer-events-auto">
        <div className="p-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col gap-1">
          <Button variant="ghost" size="sm" onClick={changeMapStyle} className={cn("h-10 w-10 p-0 rounded-xl", mapStyle.includes('satellite') ? "bg-primary/20 text-primary" : "text-white/60")}><Satellite className="w-5 h-5" /></Button>
          <Button variant="ghost" size="sm" onClick={toggleHeatmap} className={cn("h-10 w-10 p-0 rounded-xl", showHeatmap ? "bg-amber-500/20 text-amber-500" : "text-white/60")}><Thermometer className="w-5 h-5" /></Button>
          <Button variant="ghost" size="sm" onClick={toggleMarkers} className={cn("h-10 w-10 p-0 rounded-xl", showMarkers ? "bg-info/20 text-info" : "text-white/60")}><Map className="w-5 h-5" /></Button>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-5 w-64 shadow-2xl pointer-events-auto">
        <h4 className="text-sm font-black text-white uppercase tracking-tight mb-4 pb-4 border-b border-white/10">Status de Atendimento</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.5)]" /><span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Atendida</span></div>
          <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-[#eab308] shadow-[0_0_10px_rgba(234,179,8,0.5)]" /><span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Em Trâmite</span></div>
          <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.5)]" /><span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Nova Demanda</span></div>
        </div>
      </div>
    </div>
  );
};