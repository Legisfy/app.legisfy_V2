import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MapPin, TrendingUp } from "lucide-react";

interface PerformanceHeatMapProps {
  data: Array<{
    estado: string;
    sigla: string;
    cidade: string;
    gabinetes: number;
    indicacoes: number;
    demandas: number;
    atendimentos: number;
    lat?: number;
    lng?: number;
    score: number;
  }>;
  loading: boolean;
  onRefresh: () => void;
}

const PerformanceHeatMap: React.FC<PerformanceHeatMapProps> = ({ data, loading, onRefresh }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  // Coordenadas aproximadas dos estados brasileiros (capitais)
  const stateCoordinates: Record<string, [number, number]> = {
    'AC': [-70.812, -9.975], // Rio Branco
    'AL': [-35.735, -9.550], // Maceió
    'AP': [-51.066, 0.034], // Macapá
    'AM': [-60.025, -3.102], // Manaus
    'BA': [-38.501, -12.971], // Salvador
    'CE': [-38.543, -3.774], // Fortaleza
    'DF': [-47.882, -15.826], // Brasília
    'ES': [-40.308, -20.315], // Vitória
    'GO': [-49.255, -16.673], // Goiânia
    'MA': [-44.302, -2.507], // São Luís
    'MT': [-56.070, -15.601], // Cuiabá
    'MS': [-54.606, -20.469], // Campo Grande
    'MG': [-43.940, -19.932], // Belo Horizonte
    'PA': [-48.477, -1.456], // Belém
    'PB': [-34.861, -7.115], // João Pessoa
    'PR': [-49.273, -25.419], // Curitiba
    'PE': [-34.906, -8.055], // Recife
    'PI': [-42.802, -5.092], // Teresina
    'RJ': [-43.196, -22.906], // Rio de Janeiro
    'RN': [-35.211, -5.795], // Natal
    'RS': [-51.230, -30.034], // Porto Alegre
    'RO': [-63.864, -8.761], // Porto Velho
    'RR': [-60.712, 2.820], // Boa Vista
    'SC': [-48.549, -27.594], // Florianópolis
    'SP': [-46.636, -23.550], // São Paulo
    'SE': [-37.053, -10.910], // Aracaju
    'TO': [-48.360, -10.184], // Palmas
  };

  useEffect(() => {
    if (!mapContainer.current || data.length === 0) return;

    // Verificar se o token existe
    const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || 'pk.eyJ1IjoibGVnaXNmeSIsImEiOiJjbHlxMGs3aWUwNWx0MmhzOXE4dnpwejF5In0.placeholder';
    
    if (!mapboxToken.startsWith('pk.')) {
      console.warn('Token Mapbox não configurado corretamente');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Inicializar mapa
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-47.882, -15.826], // Brasília
      zoom: 4,
      projection: 'mercator'
    });

    // Adicionar controles de navegação
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    map.current.on('load', () => {
      if (!map.current) return;

      // Preparar dados para o mapa
      const features = data.map(location => {
        const coords = stateCoordinates[location.sigla] || [-47.882, -15.826];
        
        return {
          type: 'Feature',
          properties: {
            ...location,
            intensity: location.score
          },
          geometry: {
            type: 'Point',
            coordinates: coords
          }
        };
      });

      // Adicionar fonte de dados
      map.current!.addSource('performance-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features as any
        }
      });

      // Adicionar camada de círculos para representar performance
      map.current!.addLayer({
        id: 'performance-circles',
        type: 'circle',
        source: 'performance-data',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'gabinetes'],
            0, 8,
            10, 20,
            50, 35
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'score'],
            0, '#ef4444', // vermelho para baixa performance
            50, '#f59e0b', // amarelo para média performance
            80, '#10b981' // verde para alta performance
          ],
          'circle-opacity': 0.7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Adicionar labels dos estados
      map.current!.addLayer({
        id: 'state-labels',
        type: 'symbol',
        source: 'performance-data',
        layout: {
          'text-field': ['get', 'sigla'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#1f2937',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });

      // Adicionar interação de click
      map.current!.on('click', 'performance-circles', (e) => {
        if (e.features && e.features[0]) {
          setSelectedLocation(e.features[0].properties);
        }
      });

      // Mudar cursor para pointer ao passar por cima
      map.current!.on('mouseenter', 'performance-circles', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current!.on('mouseleave', 'performance-circles', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [data]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-700 border-green-200";
    if (score >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  return (
    <div className="grid gap-4">
      {/* Mapa de Calor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Mapa de Performance por Estado
              </CardTitle>
              <CardDescription>
                Visualização geográfica da performance dos gabinetes
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div ref={mapContainer} className="w-full h-96 rounded-lg shadow-sm border" />
            
            {/* Legenda */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md">
              <h4 className="font-semibold text-sm mb-2">Legenda</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Alta Performance (80+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Média Performance (50-79)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Baixa Performance (0-49)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes da Localização Selecionada */}
      {selectedLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {selectedLocation.estado} ({selectedLocation.sigla})
            </CardTitle>
            <CardDescription>
              Detalhes de performance da região selecionada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{selectedLocation.gabinetes}</div>
                <p className="text-sm text-blue-600">Gabinetes</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{selectedLocation.indicacoes}</div>
                <p className="text-sm text-green-600">Indicações</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{selectedLocation.demandas}</div>
                <p className="text-sm text-purple-600">Demandas</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{selectedLocation.atendimentos}</div>
                <p className="text-sm text-orange-600">Atendimentos</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Score de Performance:</span>
              <Badge className={getScoreBadge(selectedLocation.score)}>
                {selectedLocation.score}/100
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceHeatMap;