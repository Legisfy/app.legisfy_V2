import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Thermometer, Satellite, Map, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface Eleitor {
  id: number;
  nome: string;
  bairro: string;
  telefone: string;
  email: string;
  endereco: string;
  tags: string[];
  foto: string;
  indicacoes: number;
  demandas: number;
  lat?: number;
  lng?: number;
}

interface EleitoresMapProps {
  eleitores: Eleitor[];
  bairros: string[];
  tags: string[];
}

// Coordenadas aproximadas para os bairros de Vitória ES
const bairroCoordinates: { [key: string]: [number, number] } = {
  "Centro": [-40.3094, -20.3155],
  "Praia do Canto": [-40.2894, -20.2955],
  "Jardim da Penha": [-40.2794, -20.2855],
  "Vila Rubim": [-40.3194, -20.3255],
  "Santa Helena": [-40.2994, -20.3055],
  "Bento Ferreira": [-40.3094, -20.3055],
  "Mata da Praia": [-40.2794, -20.2755]
};

export const EleitoresMap: React.FC<EleitoresMapProps> = ({ eleitores, bairros, tags }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBairro, setSelectedBairro] = useState("Bairro");
  const [selectedTag, setSelectedTag] = useState("Tag");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/light-v11');
  const [eleitoresWithCoords, setEleitoresWithCoords] = useState<Eleitor[]>([]);

  // Function to geocode eleitores
  const geocodeEleitores = async () => {
    const promises = eleitores.map(async (eleitor) => {
      // If already has coordinates, use them
      if (eleitor.lat && eleitor.lng) {
        return eleitor;
      }

      // Try to geocode using the address
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(eleitor.endereco + ', ' + eleitor.bairro)}`);
        const data = await response.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);

          return {
            ...eleitor,
            lat,
            lng
          };
        }
      } catch (error) {
        console.error('Geocoding error for', eleitor.nome, error);
      }

      // Fallback to approximate coordinates based on neighborhood
      const coords = bairroCoordinates[eleitor.bairro];
      if (coords) {
        return {
          ...eleitor,
          lat: coords[1] + (Math.random() - 0.5) * 0.01,
          lng: coords[0] + (Math.random() - 0.5) * 0.01
        };
      }

      return eleitor;
    });

    const results = await Promise.all(promises);
    const validEleitores = results.filter(eleitor => eleitor.lat && eleitor.lng);
    setEleitoresWithCoords(validEleitores);
  };

  // Filter eleitores
  const filteredEleitores = eleitoresWithCoords.filter(eleitor => {
    const matchesSearch = eleitor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eleitor.bairro.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBairro = selectedBairro === "Bairro" || eleitor.bairro === selectedBairro;
    const matchesTag = selectedTag === "Tag" || eleitor.tags.includes(selectedTag);

    return matchesSearch && matchesBairro && matchesTag;
  });

  const initializeMap = () => {
    if (!mapContainer.current || isMapInitialized) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1', // Estilo escuro moderno
      center: [-40.3094, -20.3155], // Vitória ES center
      zoom: 11,
      pitch: 45 // Leve inclinação para profundidade
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      addEleitoresData();
      setIsMapInitialized(true);
    });
  };

  const addEleitoresData = () => {
    if (!map.current) return;

    const geojsonData = {
      type: 'FeatureCollection',
      features: filteredEleitores.map(eleitor => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [eleitor.lng!, eleitor.lat!]
        },
        properties: {
          id: eleitor.id,
          nome: eleitor.nome,
          bairro: eleitor.bairro,
          telefone: eleitor.telefone,
          tags: eleitor.tags.join(', '),
          indicacoes: eleitor.indicacoes,
          demandas: eleitor.demandas,
          weight: eleitor.indicacoes + eleitor.demandas + 1
        }
      }))
    };

    // Adicionar ou atualizar fonte de dados com cluster enabled
    if (!map.current.getSource('eleitores')) {
      map.current.addSource('eleitores', {
        type: 'geojson',
        data: geojsonData as any,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });
    }

    // Camada de Clusters
    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'eleitores',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          'rgba(59, 130, 246, 0.4)',
          10,
          'rgba(139, 92, 246, 0.4)',
          50,
          'rgba(236, 72, 153, 0.4)'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          10,
          30,
          50,
          40
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-blur': 0.2
      }
    });

    // Número de eleitores no cluster
    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'eleitores',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Camada de Pontos Individuais (quando não agrupados)
    map.current.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'eleitores',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#3b82f6',
        'circle-radius': 6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-emissive-strength': 1
      }
    });

    // Mapa de Calor aprimorado
    if (showHeatmap && !map.current.getLayer('eleitores-heat')) {
      map.current.addLayer({
        id: 'eleitores-heat',
        type: 'heatmap',
        source: 'eleitores',
        maxzoom: 15,
        paint: {
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            11, 1,
            15, 3
          ],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.2, 'rgba(59, 130, 246, 0.2)',
            0.4, 'rgba(139, 92, 246, 0.4)',
            0.6, 'rgba(236, 72, 153, 0.6)',
            0.8, 'rgba(255, 255, 255, 0.8)',
            1, '#ffffff'
          ],
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            11, 20,
            15, 30
          ]
        }
      });
    }

    // Clique no cluster para zoom
    map.current.on('click', 'clusters', (e) => {
      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      const clusterId = features?.[0].properties?.cluster_id;

      (map.current?.getSource('eleitores') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;
          map.current?.easeTo({
            center: (features?.[0].geometry as any).coordinates,
            zoom: zoom!
          });
        }
      );
    });

    // Tooltip Individual antigo adaptado
    map.current.on('click', 'unclustered-point', (e) => {
      if (!e.features || !e.features[0]) return;

      const feature = e.features[0];
      const coordinates = (feature.geometry as any).coordinates.slice();
      const properties = feature.properties;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new mapboxgl.Popup({
        className: 'glass-popup',
        closeButton: false,
        maxWidth: '300px'
      })
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-2xl">
            <h3 class="font-black text-lg mb-1 font-outfit uppercase tracking-tight">${properties?.nome}</h3>
            <p class="text-xs text-white/60 mb-2 uppercase tracking-widest">${properties?.bairro}</p>
            <div class="flex items-center gap-3 mb-3">
              <span class="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20">${properties?.indicacoes} Indicações</span>
              <span class="text-[10px] font-bold bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">${properties?.demandas} Demandas</span>
            </div>
            <button 
              onclick="window.open('https://www.google.com/maps/@${coordinates[1]},${coordinates[0]},21z/data=!3m1!1e3', '_blank')"
              class="w-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider h-9 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              Street View
            </button>
          </div>
        `)
        .addTo(map.current!);
    });

    // Mudar cursor
    map.current.on('mouseenter', 'clusters', () => { map.current!.getCanvas().style.cursor = 'pointer'; });
    map.current.on('mouseleave', 'clusters', () => { map.current!.getCanvas().style.cursor = ''; });
    map.current.on('mouseenter', 'unclustered-point', () => { map.current!.getCanvas().style.cursor = 'pointer'; });
    map.current.on('mouseleave', 'unclustered-point', () => { map.current!.getCanvas().style.cursor = ''; });
  };

  const updateMapData = () => {
    if (!map.current || !isMapInitialized) return;

    const source = map.current.getSource('eleitores') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: filteredEleitores.map(eleitor => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [eleitor.lng!, eleitor.lat!]
          },
          properties: {
            id: eleitor.id,
            nome: eleitor.nome,
            bairro: eleitor.bairro,
            telefone: eleitor.telefone,
            tags: eleitor.tags.join(', '),
            indicacoes: eleitor.indicacoes,
            demandas: eleitor.demandas,
            weight: eleitor.indicacoes + eleitor.demandas + 1
          }
        }))
      });
    }
  };

  const toggleHeatmap = () => {
    if (!map.current) return;

    const visibility = showHeatmap ? 'none' : 'visible';
    if (map.current.getLayer('eleitores-heat')) {
      map.current.setLayoutProperty('eleitores-heat', 'visibility', visibility);
    }
    setShowHeatmap(!showHeatmap);
  };

  const toggleMarkers = () => {
    if (!map.current) return;

    const visibility = showMarkers ? 'none' : 'visible';
    if (map.current.getLayer('eleitores-markers')) {
      map.current.setLayoutProperty('eleitores-markers', 'visibility', visibility);
    }
    setShowMarkers(!showMarkers);
  };

  const changeMapStyle = () => {
    if (!map.current) return;

    const isCurrentlySatellite = mapStyle.includes('satellite');
    const newStyle = isCurrentlySatellite
      ? 'mapbox://styles/mapbox/light-v11'
      : 'mapbox://styles/mapbox/satellite-v9';

    map.current.setStyle(newStyle);
    setMapStyle(newStyle);

    // Re-add layers after style change
    map.current.once('styledata', () => {
      addEleitoresData();
    });
  };

  useEffect(() => {
    geocodeEleitores();
  }, [eleitores]);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    updateMapData();
  }, [filteredEleitores, isMapInitialized]);

  return (
    <div className="h-full relative overflow-hidden bg-zinc-950 rounded-[2.5rem] border border-white/5 shadow-2xl">
      {/* Mapa */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Camada de Gradiente Superior (Visual Depth) */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {/* Controles Flutuantes Superiores */}
      <div className="absolute top-6 inset-x-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pointer-events-none">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto pointer-events-auto">
          {/* Busca Glassmorphic */}
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Buscar território ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 bg-black/40 backdrop-blur-2xl border-white/10 text-white rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-white/20"
            />
          </div>

          <div className="flex gap-2">
            <Select value={selectedBairro} onValueChange={setSelectedBairro}>
              <SelectTrigger className="h-12 bg-black/40 backdrop-blur-2xl border-white/10 text-white rounded-2xl w-[180px]">
                <MapPin className="w-4 h-4 mr-2 text-primary" />
                <SelectValue placeholder="Bairro" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="Bairro">Todos Bairros</SelectItem>
                {bairros.map(bairro => (
                  <SelectItem key={bairro} value={bairro}>{bairro}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="h-12 bg-black/40 backdrop-blur-2xl border-white/10 text-white rounded-2xl w-[150px]">
                <Tag className="w-4 h-4 mr-2 text-amber-500" />
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="Tag">Todas Tags</SelectItem>
                {tags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Badge */}
        <div className="pointer-events-auto">
          <Badge className="h-10 px-4 bg-primary text-white rounded-xl border-none shadow-lg shadow-primary/20 font-black font-outfit uppercase tracking-wider text-[10px]">
            {filteredEleitores.length} Eleitores Mapeados
          </Badge>
        </div>
      </div>

      {/* Controles de Visualização (Inferior Esquerdo) */}
      <div className="absolute bottom-8 left-8 flex flex-col gap-3 pointer-events-auto">
        <div className="p-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={changeMapStyle}
            className={cn(
              "h-10 w-10 p-0 rounded-xl transition-all",
              mapStyle.includes('satellite') ? "bg-primary/20 text-primary" : "text-white/60 hover:text-white"
            )}
            title="Vista de Satélite"
          >
            <Satellite className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleHeatmap}
            className={cn(
              "h-10 w-10 p-0 rounded-xl transition-all",
              showHeatmap ? "bg-amber-500/20 text-amber-500" : "text-white/60 hover:text-white"
            )}
            title="Mapa de Calor"
          >
            <Thermometer className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMarkers}
            className={cn(
              "h-10 w-10 p-0 rounded-xl transition-all",
              showMarkers ? "bg-info/20 text-info" : "text-white/60 hover:text-white"
            )}
            title="Exibir Pontos"
          >
            <Map className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Legenda Flutuante (Inferior Direito) */}
      <div className="absolute bottom-8 right-20 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-5 w-64 shadow-2xl">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
          <div className="p-2 bg-primary/20 rounded-lg">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <h4 className="text-sm font-black text-white font-outfit uppercase tracking-tight">Inteligência de Campo</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:scale-125 transition-transform" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Base Consolidada</span>
            </div>
            <span className="text-[10px] font-black text-white/30 tracking-widest">Normal</span>
          </div>

          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] group-hover:scale-125 transition-transform" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Demandas Ativas</span>
            </div>
            <span className="text-[10px] font-black text-white/30 tracking-widest">Alerta</span>
          </div>

          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(139,92,246,0.5)] group-hover:scale-125 transition-transform" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Densidade Local</span>
            </div>
            <span className="text-[10px] font-black text-white/30 tracking-widest">Forte</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">
            <div className="w-1 h-1 rounded-full bg-white/20 animate-pulse" />
            Análise em Tempo Real
          </div>
        </div>
      </div>
    </div>
  );
};