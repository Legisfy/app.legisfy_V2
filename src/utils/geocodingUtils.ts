import { supabase } from '@/integrations/supabase/client';

interface Indicacao {
  id: string;
  endereco_rua?: string;
  endereco_bairro?: string;
  endereco_cep?: string;
  latitude?: number;
  longitude?: number;
}

// Função para geocodificar um endereço usando a API do Mapbox
export const geocodeAddress = async (
  rua: string,
  bairro: string,
  cep: string,
  cidade: string = 'Vitória',
  estado: string = 'ES'
): Promise<{ lat: number; lng: number } | null> => {
  // Limpar e formatar dados
  const ruaLimpa = rua?.trim() || '';
  const bairroLimpo = bairro?.trim() || '';
  const cepLimpo = cep?.replace(/\D/g, '') || '';

  if (!ruaLimpa) return null;

  // Montar query para geocodificação
  const query = [
    ruaLimpa,
    bairroLimpo || null,
    cidade,
    estado,
    cepLimpo || null,
    'Brasil'
  ].filter(Boolean).join(', ');

  try {
    const encoded = encodeURIComponent(query);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}&country=BR&language=pt-BR&autocomplete=false&types=address&limit=5`;

    console.log('Geocoding query:', query);
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.features) && data.features.length) {
        // Escolher o melhor resultado
        let best = data.features[0];
        let bestScore = -1;

        for (const f of data.features) {
          let score = (typeof f.relevance === 'number' ? f.relevance : 0);

          // Preferir resultados que tenham o CEP correto
          if (cepLimpo && cepLimpo.length >= 5) {
            const fPost = (f.context || []).find((c: any) => String(c.id).startsWith('postcode'))?.text?.replace(/\D/g, '') || '';
            if (fPost && fPost.startsWith(cepLimpo.slice(0, 5))) {
              score += 1.5;
            }
          }

          // Preferir resultados que tenham o bairro correto
          if (bairroLimpo) {
            const fBairro = (f.context || []).find((c: any) =>
              String(c.id).startsWith('neighborhood') || String(c.id).startsWith('locality')
            )?.text?.toLowerCase() || '';
            if (fBairro && fBairro.includes(bairroLimpo.toLowerCase())) {
              score += 1.0;
            }
          }

          if (score > bestScore) {
            best = f;
            bestScore = score;
          }
        }

        const [lng, lat] = best.center as [number, number];
        console.log('Geocoding success:', { query, lat, lng, relevance: best.relevance });
        return { lat, lng };
      }
    }
  } catch (error) {
    console.error('Geocoding error for query:', query, error);
  }

  return null;
};

// Função para atualizar coordenadas de indicações existentes que não possuem latitude/longitude
export const updateIndicacoesCoordinates = async (gabineteId: string): Promise<{
  updated: number;
  errors: number;
  total: number;
}> => {
  try {
    console.log('Starting coordinate update for gabinete:', gabineteId);

    // Buscar indicações sem coordenadas
    const { data: indicacoes, error: fetchError } = await supabase
      .from('indicacoes')
      .select('id, endereco_rua, endereco_bairro, endereco_cep, latitude, longitude')
      .eq('gabinete_id', gabineteId)
      .or('latitude.is.null,longitude.is.null')
      .not('endereco_rua', 'is', null);

    if (fetchError) {
      console.error('Error fetching indicacoes:', fetchError);
      throw fetchError;
    }

    if (!indicacoes || indicacoes.length === 0) {
      console.log('No indicacoes found that need coordinate updates');
      return { updated: 0, errors: 0, total: 0 };
    }

    console.log(`Found ${indicacoes.length} indicacoes needing coordinate updates`);

    let updated = 0;
    let errors = 0;

    // Processar cada indicação com delay para evitar rate limiting
    for (const indicacao of indicacoes) {
      try {
        console.log(`Processing indicacao ${indicacao.id}:`, {
          rua: indicacao.endereco_rua,
          bairro: indicacao.endereco_bairro,
          cep: indicacao.endereco_cep
        });

        // Geocodificar endereço
        const coords = await geocodeAddress(
          indicacao.endereco_rua || '',
          indicacao.endereco_bairro || '',
          indicacao.endereco_cep || ''
        );

        if (coords) {
          // Atualizar na base de dados
          const { error: updateError } = await supabase
            .from('indicacoes')
            .update({
              latitude: coords.lat,
              longitude: coords.lng
            })
            .eq('id', indicacao.id);

          if (updateError) {
            console.error(`Error updating indicacao ${indicacao.id}:`, updateError);
            errors++;
          } else {
            console.log(`Successfully updated indicacao ${indicacao.id} with coordinates:`, coords);
            updated++;
          }
        } else {
          console.log(`Could not geocode address for indicacao ${indicacao.id}`);
          errors++;
        }

        // Delay para evitar rate limiting (1 request por segundo)
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing indicacao ${indicacao.id}:`, error);
        errors++;
      }
    }

    const result = { updated, errors, total: indicacoes.length };
    console.log('Coordinate update completed:', result);
    return result;

  } catch (error) {
    console.error('Error in updateIndicacoesCoordinates:', error);
    throw error;
  }
};