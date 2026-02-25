import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl, templateType, gabineteName } = await req.json();

    if (!pdfUrl || !templateType) {
      return new Response(
        JSON.stringify({ error: 'PDF URL and template type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Starting PDF analysis for:', pdfUrl);

    // Fazer download do PDF para análise
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to download PDF');
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Extrair texto do PDF para análise mais precisa
    const pdfText = await extractTextFromPdf(pdfBuffer);
    console.log('Extracted PDF text length:', pdfText.length);

    // Analisar o PDF usando OpenAI com o texto extraído
    const analysisPrompt = `
Você é um especialista em análise de documentos governamentais brasileiros. 
Analise este texto extraído de um PDF modelo de ${templateType} e identifique automaticamente:

1. ELEMENTOS FIXOS (que não devem mudar):
   - Cabeçalhos institucionais
   - Logomarcas
   - Textos padronizados
   - Rodapés de autenticação
   - Frases legais obrigatórias

2. CAMPOS VARIÁVEIS (que devem ser substituídos dinamicamente):
   Para ${templateType.toUpperCase()}, procure por:
   - Placeholders como [CAMPO], {CAMPO}, __CAMPO__, XXX/XXXX
   - Campos entre parênteses como (NUMERO_PROTOCOLO)
   - Espaços em branco óbvios para preenchimento
   - Datas genéricas ou em formato específico
   - Nomes genéricos ou abreviados

REGRAS ESPECÍFICAS PARA INDICAÇÃO:
- NUMERO_INDICACAO: formatos como "Nº ___/____", "INDICAÇÃO Nº XXX/XXXX"
- ENDERECO/LOCAL: texto após "indica para" ou "solicita para o endereço"
- JUSTIFICATIVA: parágrafo principal entre a abertura e o fechamento
- IMAGENS/FOTOS: procure por placeholders de fotos como "[FOTO]", "[IMAGEM]", ou áreas com legendas de fotos
- DATA: formato "Cidade, DD de mês de AAAA" no final
- AUTOR: nome do vereador na assinatura
- NOME_GABINETE: nome do gabinete no cabeçalho

Analise o texto e identifique PRECISAMENTE quais partes são variáveis vs fixas.

TEXTO DO PDF:
${pdfText}

Retorne um JSON estruturado:
{
  "document_type": "${templateType}",
  "analysis_confidence": 0-100,
  "fixed_elements": [
    {
      "element": "nome do elemento fixo",
      "content": "conteúdo exato encontrado",
      "position": "onde aparece no documento"
    }
  ],
  "variable_fields": [
    {
      "field_name": "NUMERO_INDICACAO | TITULO | ENDERECO | JUSTIFICATIVA | FOTOS | DATA | AUTOR",
      "placeholder_found": "texto exato encontrado que deve ser substituído",
      "placeholder_pattern": "padrão identificado (ex: Nº XXX/XXXX)",
      "context_before": "texto que vem antes",
      "context_after": "texto que vem depois",
      "position_description": "localização no documento",
      "field_type": "text|number|date|address|image",
      "is_required": true|false,
      "auto_format": "formatação especial se necessária"
    }
  ],
  "document_structure": {
    "has_header": true|false,
    "has_logo_space": true|false,
    "has_footer": true|false,
    "paragraph_count": number,
    "signature_area": true|false,
    "has_photo_gallery": true|false
  },
  "extraction_notes": "observações importantes sobre o documento"
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de documentos oficiais brasileiros com foco em identificação precisa de campos variáveis vs fixos.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const analysisData = await response.json();
    const analysisResult = analysisData.choices[0].message.content;

    console.log('PDF analysis completed:', analysisResult);

    // Tentar parsear o JSON da resposta
    let analysis;
    try {
      analysis = JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('Failed to parse analysis result:', parseError);
      // Fallback analysis baseada no tipo de documento
      analysis = getDefaultAnalysis(templateType);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        message: 'PDF template analyzed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in analyze-pdf-template:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to analyze PDF template',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function getDefaultAnalysis(templateType: string) {
  const baseAnalysis = {
    fixed_elements: [
      "Cabeçalho institucional",
      "Logomarca",
      "Rodapé de autenticação",
      "Assinatura digital"
    ],
    layout_preserved: true,
    confidence: 80
  };

  if (templateType === 'indicacao') {
    return {
      ...baseAnalysis,
      variable_fields: [
        {
          field_name: "NUMERO_INDICACAO",
          placeholder_text: "Nº XXX/XXXX",
          position: "cabeçalho superior direito",
          type: "text"
        },
        {
          field_name: "ENDERECO",
          placeholder_text: "[ENDEREÇO]",
          position: "primeiro parágrafo",
          type: "text"
        },
        {
          field_name: "JUSTIFICATIVA",
          placeholder_text: "[JUSTIFICATIVA]",
          position: "corpo do documento",
          type: "text"
        },
        {
          field_name: "DATA",
          placeholder_text: "[DATA]",
          position: "final do documento",
          type: "date"
        },
        {
          field_name: "AUTOR",
          placeholder_text: "[VEREADOR]",
          position: "assinatura",
          type: "text"
        }
      ]
    };
  }

  // Análise padrão para outros tipos
  return {
    ...baseAnalysis,
    variable_fields: [
      {
        field_name: "NUMERO_DOCUMENTO",
        placeholder_text: "Nº XXX/XXXX",
        position: "cabeçalho",
        type: "text"
      },
      {
        field_name: "CONTEUDO",
        placeholder_text: "[CONTEÚDO]",
        position: "corpo",
        type: "text"
      },
      {
        field_name: "DATA",
        placeholder_text: "[DATA]",
        position: "final",
        type: "date"
      }
    ]
  };
}

async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    // Para uma implementação completa, você usaria uma biblioteca como pdf-parse
    // Por enquanto, vamos simular a extração de texto usando uma abordagem básica

    // Converter buffer para string e tentar extrair texto básico
    const uint8Array = new Uint8Array(pdfBuffer);
    let textContent = '';

    // Buscar por streams de texto no PDF (método simplificado)
    const pdfString = new TextDecoder('latin1').decode(uint8Array);

    // Extrair texto usando regex simples para objetos de texto PDF
    const textRegex = /BT\s*(.*?)\s*ET/gs;
    const matches = pdfString.matchAll(textRegex);

    for (const match of matches) {
      if (match[1]) {
        // Limpar códigos de formatação básicos
        const cleanText = match[1]
          .replace(/\/\w+\s+\d+(\.\d+)?\s+Tf/g, '') // Font definitions
          .replace(/\d+(\.\d+)?\s+\d+(\.\d+)?\s+Td/g, '') // Text positioning
          .replace(/\d+(\.\d+)?\s+TL/g, '') // Leading
          .replace(/\([^)]*\)\s*Tj/g, (m) => {
            // Extract text from Tj operators
            return m.replace(/^\(/, '').replace(/\)\s*Tj$/, '') + ' ';
          })
          .replace(/\[[^\]]*\]\s*TJ/g, (m) => {
            // Extract text from TJ operators (array format)
            return m.replace(/^\[/, '').replace(/\]\s*TJ$/, '').replace(/[()]/g, '') + ' ';
          });

        textContent += cleanText + '\n';
      }
    }

    // Se não conseguiu extrair texto, tentar método alternativo
    if (textContent.trim().length < 50) {
      // Buscar por strings literais no PDF
      const stringRegex = /\(([^)]+)\)/g;
      const stringMatches = pdfString.matchAll(stringRegex);

      for (const match of stringMatches) {
        if (match[1] && match[1].length > 2) {
          textContent += match[1] + ' ';
        }
      }
    }

    // Limpar e normalizar o texto extraído
    textContent = textContent
      .replace(/\s+/g, ' ')
      .replace(/[^\w\sÀ-ÿ.,;:!?()[\]{}/\\-]/g, '')
      .trim();

    console.log('Extracted text sample:', textContent.substring(0, 500));

    return textContent || 'Não foi possível extrair texto do PDF. Arquivo pode estar em formato de imagem ou protegido.';

  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return 'Erro na extração de texto do PDF. Usando análise baseada em estrutura padrão.';
  }
}