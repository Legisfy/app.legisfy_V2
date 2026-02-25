import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    console.error('Error parsing request body:', e);
  }

  const {
    templateId,
    gabineteName,
    indicacaoData,
    variables,
    correctionPrompt,
    photos = [] // Novas fotos vindas do modal
  } = body;

  try {
    if (!templateId || !indicacaoData) {
      return new Response(
        JSON.stringify({ error: 'Template ID and indicacao data are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting document generation for template:', templateId);

    // Buscar o template do banco
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    // Gerar número sequencial da indicação
    const { data: existingIndicacoes } = await supabase
      .from('indicacoes')
      .select('id')
      .eq('gabinete_id', template.gabinete_id)
      .order('created_at', { ascending: false });

    const numeroIndicacao = `${String(existingIndicacoes?.length + 1 || 1).padStart(3, '0')}/${new Date().getFullYear()}`;

    // Padronizar endereço
    const enderecoCompleto = formatarEndereco(indicacaoData.endereco || '');

    // Formatar data por extenso
    const dataFormatada = formatarDataPorExtenso(new Date());

    // Gerar ou corrigir justificativa com IA
    const justificativaCorrigida = await gerarOuCorrigirJustificativa(
      indicacaoData.justificativa || '',
      indicacaoData.titulo || '',
      enderecoCompleto,
      openaiApiKey,
      correctionPrompt
    );

    // Preparar variáveis para substituição
    const variableValues = {
      NUMERO_INDICACAO: numeroIndicacao,
      TITULO: indicacaoData.titulo || '',
      ENDERECO: enderecoCompleto,
      JUSTIFICATIVA: justificativaCorrigida,
      DATA: dataFormatada,
      AUTOR: `${indicacaoData.autor || gabineteName}`,
      LOGO: template.logo_url || variables?.logoUrl || '',
      FOTOS: photos, // Inclui as fotos nas variáveis
      ...variables
    };
    console.log('Variables for document generation:', variableValues);

    // Gerar PDF usando IA para manter layout
    const generatedPdfUrl = await generatePdfWithAI(
      template.original_pdf_url,
      template.template_analysis,
      variableValues,
      openaiApiKey
    );

    // Salvar no storage
    const storageFileName = `indicacoes/${template.gabinete_id}/${new Date().getFullYear()}/${numeroIndicacao.replace('/', '-')}.pdf`;

    // Registrar geração no banco
    const { data: generation, error: generationError } = await supabase
      .from('document_generations')
      .insert({
        template_id: templateId,
        gabinete_id: template.gabinete_id,
        related_entity_type: 'indicacao',
        related_entity_id: indicacaoData.id,
        variables_used: variableValues,
        generated_pdf_url: generatedPdfUrl,
        generation_status: 'success',
        created_by: indicacaoData.user_id
      })
      .select()
      .single();

    if (generationError) {
      console.error('Error saving generation record:', generationError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        generatedPdfUrl,
        variables: variableValues,
        numeroIndicacao,
        generationId: generation?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in generate-document:', error);

    // Registrar erro no banco se possível
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase
        .from('document_generations')
        .insert({
          template_id: body.templateId || null,
          gabinete_id: body.variables?.gabinetId || null,
          generation_status: 'error',
          error_details: error.message,
          variables_used: body.variables || {},
          generated_pdf_url: '',
          created_by: body.variables?.userId || null
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to generate document',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function gerarOuCorrigirJustificativa(
  justificativaOriginal: string,
  titulo: string,
  endereco: string,
  apiKey: string,
  correctionPrompt?: string
): Promise<string> {

  // Se há prompt de correção, usar para corrigir a justificativa existente
  if (correctionPrompt && justificativaOriginal) {
    console.log('Aplicando correção específica:', correctionPrompt);
    return await aplicarCorrecaoEspecifica(justificativaOriginal, correctionPrompt, titulo, endereco, apiKey);
  }

  // Se justificativa existe e tem tamanho adequado, apenas corrige
  if (justificativaOriginal && justificativaOriginal.length >= 100) {
    console.log('Corrigindo justificativa existente...');
    return await corrigirTextoComIA(justificativaOriginal, apiKey);
  }

  // Se justificativa não existe ou é muito curta, gera nova
  console.log('Gerando nova justificativa com IA...');

  const prompt = `
Gere uma justificativa técnica e formal para uma indicação legislativa com os seguintes dados:

TÍTULO: ${titulo}
ENDEREÇO/LOCAL: ${endereco}
JUSTIFICATIVA ORIGINAL: ${justificativaOriginal || 'Não fornecida'}

A justificativa deve:
- Ter entre 3-5 parágrafos
- Ser formal e adequada para documento oficial
- Explicar a importância da solicitação para a comunidade
- Incluir aspectos técnicos relevantes (segurança, mobilidade, bem-estar social)
- Justificar o interesse público
- Ter linguagem apropriada para câmara municipal/assembleia legislativa

Retorne apenas o texto da justificativa, sem introduções ou comentários.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em redação de documentos legislativos brasileiros, especializado em indicações e projetos para câmaras municipais.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.2
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const justificativaGerada = data.choices[0].message.content.trim();
      console.log('Justificativa gerada pela IA:', justificativaGerada);
      return justificativaGerada;
    }
  } catch (error) {
    console.error('Error generating justification with AI:', error);
  }

  // Fallback: retorna justificativa padrão se IA falhar
  return `A presente indicação visa atender uma demanda importante da comunidade relacionada a ${titulo}. 
A solicitação para o endereço ${endereco} se justifica pela necessidade de melhoria da qualidade de vida dos cidadãos e pelo interesse público envolvido. 
É de fundamental importância que o poder público atenda às necessidades da população, promovendo melhorias que beneficiem a coletividade.`;
}

async function aplicarCorrecaoEspecifica(
  textoOriginal: string,
  correcao: string,
  titulo: string,
  endereco: string,
  apiKey: string
): Promise<string> {
  const prompt = `
Aplique as seguintes correções ao texto de justificativa para indicação legislativa:

TEXTO ORIGINAL:
${textoOriginal}

CORREÇÕES SOLICITADAS:
${correcao}

CONTEXTO:
- Título da indicação: ${titulo}
- Endereço/Local: ${endereco}

INSTRUÇÕES:
- Aplique APENAS as correções solicitadas
- Mantenha o tom formal e adequado para documento oficial
- Preserve a estrutura e parágrafos existentes quando possível
- Se for solicitada melhoria na justificativa, enriqueça com argumentos técnicos
- Se for correção de endereço, garanta formatação padrão brasileira
- Mantenha entre 3-5 parágrafos bem estruturados

Retorne apenas o texto corrigido, sem comentários adicionais.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em revisão e correção de documentos legislativos brasileiros.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.2
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const textoCorrigido = data.choices[0].message.content.trim();
      console.log('Texto corrigido conforme solicitação:', textoCorrigido);
      return textoCorrigido;
    }
  } catch (error) {
    console.error('Error applying specific correction:', error);
  }

  return textoOriginal; // Retorna original em caso de erro
}

async function corrigirTextoComIA(texto: string, apiKey: string): Promise<string> {
  if (!texto || texto.length < 10) {
    return texto;
  }

  const prompt = `
Corrija ortográfica e gramaticalmente o texto abaixo, mantendo o tom formal e adequado para um documento oficial/governamental. 
Garanta que tenha entre 2-5 parágrafos bem estruturados, removendo redundâncias desnecessárias.

Texto original:
${texto}

Retorne apenas o texto corrigido, sem comentários adicionais.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um revisor especializado em documentos oficiais brasileiros.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content.trim();
    }
  } catch (error) {
    console.error('Error correcting text with AI:', error);
  }

  return texto; // Retorna texto original se houver erro
}

function formatarEndereco(endereco: string): string {
  if (!endereco) return '';

  let enderecoFormatado = endereco
    .replace(/\bR\./gi, 'Rua')
    .replace(/\bAv\./gi, 'Avenida')
    .replace(/\bStr\./gi, 'Rua')
    .replace(/\bTrav\./gi, 'Travessa')
    .replace(/\bPç\./gi, 'Praça')
    .replace(/\bAl\./gi, 'Alameda')
    .replace(/\bRod\./gi, 'Rodovia')
    .replace(/\bEst\./gi, 'Estrada');

  // Garantir formato: Tipo, nº, Bairro, Cidade – UF, CEP
  const parts = enderecoFormatado.split(',').map(p => p.trim());
  return parts.join(', ');
}

function formatarDataPorExtenso(data: Date): string {
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const dia = data.getDate().toString().padStart(2, '0');
  const mes = meses[data.getMonth()];
  const ano = data.getFullYear();

  return `Vitória, ${dia} de ${mes} de ${ano}`;
}

async function generatePdfWithAI(
  originalPdfUrl: string,
  analysis: any,
  variables: any,
  apiKey: string
): Promise<string> {
  console.log('Generating PDF with analysis:', analysis);
  console.log('Variables for replacement:', variables);

  try {
    // Fazer download do PDF original
    const pdfResponse = await fetch(originalPdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to download original PDF');
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Usar IA para identificar as posições e criar instruções de substituição mais precisas
    const generationPrompt = `
Baseado na análise do template PDF e nas variáveis fornecidas, crie instruções para substituição dos campos dinâmicos.

ANÁLISE DO TEMPLATE:
${JSON.stringify(analysis, null, 2)}

VARIÁVEIS DISPONÍVEIS:
${Object.entries(variables).map(([key, value]) => `- ${key}: "${value}"`).join('\n')}

Para cada campo variável identificado na análise, crie uma substituição específica:

REGRAS PARA INDICAÇÕES:
1. NUMERO_INDICACAO: Busque por padrões como "Nº XXX/XXXX", "INDICAÇÃO Nº", "000/0000"
2. ENDERECO: Busque por "[ENDEREÇO]", "LOCAL:", depois de "indica para", espaços após vírgulas
3. JUSTIFICATIVA: Maior bloco de texto variável, entre abertura e fechamento formal
4. DATA: Formato "Cidade, DD de mês de AAAA", geralmente antes da assinatura
5. AUTOR: Nome do vereador/político na área de assinatura

IMPORTANTE: 
- Use os valores REAIS das variáveis fornecidas
- Identifique os placeholders baseado na análise do template
- Se a análise contém variable_fields, use essas informações

Retorne um JSON no formato:
{
  "success": true,
  "replacements": [
    {
      "field": "CAMPO_IDENTIFICADO",
      "old_value": "placeholder encontrado na análise",
      "new_value": "valor real da variável",
      "position_hint": "localização no documento"
    }
  ]
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em processamento de documentos PDF brasileiros. Analise cuidadosamente as informações do template e crie substituições precisas usando os valores reais fornecidos.'
          },
          {
            role: 'user',
            content: generationPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to generate document instructions with AI');
    }

    const aiResult = await response.json();
    let generationResult;

    try {
      generationResult = JSON.parse(aiResult.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw AI response:', aiResult.choices[0].message.content);

      // Fallback melhorado: usar análise do template se disponível
      const variableFields = analysis?.variable_fields || [];
      const replacements = [];

      // Criar substituições baseadas na análise do template
      for (const field of variableFields) {
        const fieldName = field.field_name || field.name;
        const placeholder = field.placeholder_found || field.placeholder_text || `[${fieldName}]`;

        if (variables[fieldName]) {
          replacements.push({
            field: fieldName,
            old_value: placeholder,
            new_value: variables[fieldName],
            position_hint: field.position_description || field.position || 'documento'
          });
        }
      }

      // Se não há campos da análise, usar fallback básico
      if (replacements.length === 0) {
        replacements.push(
          {
            field: "NUMERO_INDICACAO",
            old_value: "XXX/XXXX",
            new_value: variables.NUMERO_INDICACAO || "001/2024",
            position_hint: "cabeçalho"
          },
          {
            field: "TITULO",
            old_value: "[TÍTULO]",
            new_value: variables.TITULO || variables.titulo || "",
            position_hint: "título da indicação"
          },
          {
            field: "ENDERECO",
            old_value: "[ENDEREÇO]",
            new_value: variables.ENDERECO || "",
            position_hint: "corpo"
          },
          {
            field: "JUSTIFICATIVA",
            old_value: "[JUSTIFICATIVA]",
            new_value: variables.JUSTIFICATIVA || "",
            position_hint: "meio"
          },
          {
            field: "DATA",
            old_value: "[DATA]",
            new_value: variables.DATA || "",
            position_hint: "rodapé"
          },
          {
            field: "AUTOR",
            old_value: "[NOME DO VEREADOR]",
            new_value: variables.AUTOR || "",
            position_hint: "assinatura"
          }
        );
      }

      generationResult = {
        success: true,
        replacements: replacements.filter(r => r.new_value) // Só incluir campos com valores
      };
    }

    console.log('AI generation result:', generationResult);

    // Criar PDF modificado com as substituições reais
    const modifiedPdfBlob = await createModifiedPdf(base64Pdf, generationResult);

    // Upload do PDF modificado para o storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const fileName = `generated/indicacao-${Date.now()}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, modifiedPdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const generatedPdfUrl = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName).data.publicUrl;

    console.log('Generated PDF uploaded to:', generatedPdfUrl);
    return generatedPdfUrl;

  } catch (error) {
    console.error('Error in generatePdfWithAI:', error);
    // Em caso de erro, retorna o PDF original
    return originalPdfUrl;
  }
}

async function createModifiedPdf(originalBase64: string, modifications: any): Promise<Blob> {
  console.log('Creating modified PDF with modifications:', modifications);

  try {
    // Decodificar o PDF original
    const originalBuffer = Uint8Array.from(atob(originalBase64), c => c.charCodeAt(0));

    // Carregar o PDF usando pdf-lib
    const pdfDoc = await PDFDocument.load(originalBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Obter fontes apropriadas
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    // Extrair texto atual do PDF para identificar posições
    const pdfText = await extractTextAndPositions(originalBuffer);
    console.log('Extracted PDF structure for replacement:', pdfText);

    // Aplicar as modificações baseadas na análise
    if (modifications.replacements && Array.isArray(modifications.replacements)) {
      for (const replacement of modifications.replacements) {
        console.log(`Aplicando substituição: ${replacement.field} = ${replacement.new_value}`);

        await applyTextReplacement(
          firstPage,
          replacement,
          pdfText,
          helveticaFont,
          helveticaBoldFont,
          timesFont
        );
      }
    }

    // Reescrita do corpo para INDICAÇÃO (garante substituições visíveis)
    try {
      const vars: Record<string, string> = {};
      if (modifications.replacements && Array.isArray(modifications.replacements)) {
        for (const r of modifications.replacements) {
          if (r?.field) vars[r.field] = String(r.new_value ?? '');
        }
      }
      const hasBody = vars.TITULO || vars.JUSTIFICATIVA || vars.ENDERECO;
      if (hasBody) {
        const { pageWidth, pageHeight } = pdfText;
        const marginX = 50;
        const topY = pageHeight - 340;   // abaixo do cabeçalho do template
        const bottomY = 110;             // acima do rodapé/assinatura

        // Limpa área grande do corpo para remover texto antigo do modelo
        firstPage.drawRectangle({
          x: marginX - 10,
          y: bottomY - 10,
          width: pageWidth - (marginX * 2) + 20,
          height: topY - bottomY + 20,
          color: rgb(1, 1, 1),
        });

        // Cabeçalho: INDICAÇÃO (centralizado)
        const heading = 'INDICAÇÃO';
        const headingSize = 12;
        const headingWidth = helveticaBoldFont.widthOfTextAtSize(heading, headingSize);
        const headingX = (pageWidth - headingWidth) / 2;
        let cursorY = topY - 6;
        firstPage.drawText(heading, { x: headingX, y: cursorY, size: headingSize, font: helveticaBoldFont, color: rgb(0, 0, 0) });

        cursorY -= 28;

        // Título (negrito, maiúsculas)
        if (vars.TITULO) {
          const tituloText = vars.TITULO.toUpperCase();
          const tituloLines = wrapText(tituloText, pageWidth - marginX * 2, helveticaBoldFont as any, 11);
          for (const line of tituloLines.slice(0, 4)) {
            firstPage.drawText(line, { x: marginX, y: cursorY, size: 11, font: helveticaBoldFont, color: rgb(0, 0, 0) });
            cursorY -= 16;
          }
          cursorY -= 6;
        }

        // Endereço
        if (vars.ENDERECO) {
          const endLabel = 'Endereço: ';
          const labelWidth = helveticaBoldFont.widthOfTextAtSize(endLabel, 11);
          firstPage.drawText(endLabel, { x: marginX, y: cursorY, size: 11, font: helveticaBoldFont, color: rgb(0, 0, 0) });
          const endLines = wrapText(vars.ENDERECO, (pageWidth - marginX * 2) - labelWidth, helveticaFont as any, 11);
          let endX = marginX + labelWidth;
          for (const line of endLines.slice(0, 4)) {
            firstPage.drawText(line, { x: endX, y: cursorY, size: 11, font: helveticaFont, color: rgb(0, 0, 0) });
            cursorY -= 16;
            endX = marginX; // próximas linhas começam alinhadas
          }
          cursorY -= 6;
        }

        // Subtítulo JUSTIFICATIVA (centralizado)
        if (vars.JUSTIFICATIVA) {
          const sub = 'JUSTIFICATIVA';
          const subSize = 12;
          const subWidth = helveticaBoldFont.widthOfTextAtSize(sub, subSize);
          const subX = (pageWidth - subWidth) / 2;
          firstPage.drawText(sub, { x: subX, y: cursorY, size: subSize, font: helveticaBoldFont, color: rgb(0, 0, 0) });
          cursorY -= 24;

          // Parágrafos da justificativa
          const paragraphs = String(vars.JUSTIFICATIVA).split(/\n+/).filter(Boolean);
          for (const p of paragraphs) {
            const lines = wrapText(p, pageWidth - marginX * 2, timesFont as any, 11);
            for (const line of lines) {
              if (cursorY < bottomY + 20) break; // evitar ultrapassar a área
              firstPage.drawText(line, { x: marginX, y: cursorY, size: 11, font: timesFont, color: rgb(0, 0, 0) });
              cursorY -= 16;
            }
            cursorY -= 8;
            if (cursorY < bottomY + 20) break;
          }
        }
      }
    } catch (e) {
      console.warn('Body rewrite fallback failed, proceeding with simple replacements:', e);
    }

    // Adicionar Galeria de Fotos se existirem
    if (modifications.replacements.find((r: any) => r.field === 'FOTOS')?.new_value?.length > 0) {
      const photos = modifications.replacements.find((r: any) => r.field === 'FOTOS').new_value;
      await addPhotoGalleryPage(pdfDoc, photos);
    }

    // Salvar o PDF modificado
    const modifiedPdfBytes = await pdfDoc.save();
    return new Blob([modifiedPdfBytes], { type: 'application/pdf' });

  } catch (error) {
    console.error('Error modifying PDF:', error);
    // Em caso de erro, retorna o PDF original
    const originalBuffer = Uint8Array.from(atob(originalBase64), c => c.charCodeAt(0));
    return new Blob([originalBuffer], { type: 'application/pdf' });
  }
}

async function extractTextAndPositions(pdfBuffer: Uint8Array): Promise<any> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Informações básicas da página
    const { width, height } = firstPage.getSize();

    console.log(`PDF dimensions: ${width}x${height}`);

    return {
      pageWidth: width,
      pageHeight: height,
      // Posições otimizadas baseadas em templates típicos de indicações municipais brasileiras
      placeholderPositions: {
        'NUMERO_INDICACAO': {
          x: width * 0.65,    // 65% da largura (canto superior direito)
          y: height - 100,    // 100 pontos do topo
          width: width * 0.3, // 30% da largura
          height: 24
        },
        'TITULO': {
          x: 60,
          y: height - 360,    // Logo acima do corpo
          width: width - 120,
          height: 40
        },
        'ENDERECO': {
          x: 60,              // Margem esquerda padrão
          y: height - 320,    // Após abertura padrão
          width: width - 120, // Quase toda largura
          height: 120         // Altura maior para endereços longos
        },
        'JUSTIFICATIVA': {
          x: 60,              // Margem esquerda padrão
          y: height - 520,    // Meio do documento
          width: width - 120, // Quase toda largura
          height: 300         // Área extensa para múltiplos parágrafos
        },
        'DATA': {
          x: 60,              // Margem esquerda
          y: height - 720,    // Próximo ao final
          width: 300,         // Largura para data por extenso
          height: 24
        },
        'AUTOR': {
          x: width * 0.45,    // Centro-direita da página
          y: height - 780,    // Área de assinatura
          width: width * 0.45,// 45% da largura
          height: 50          // Altura para nome e cargo
        }
      }
    };
  } catch (error) {
    console.error('Error extracting text positions:', error);
    return {
      pageWidth: 595,
      pageHeight: 842, // A4 padrão
      placeholderPositions: {
        'NUMERO_INDICACAO': { x: 400, y: 742, width: 150, height: 20 },
        'ENDERECO': { x: 60, y: 522, width: 475, height: 60 },
        'JUSTIFICATIVA': { x: 60, y: 322, width: 475, height: 180 },
        'DATA': { x: 60, y: 122, width: 300, height: 20 },
        'AUTOR': { x: 268, y: 62, width: 268, height: 40 }
      }
    };
  }
}

async function applyTextReplacement(
  page: any,
  replacement: any,
  pdfStructure: any,
  helveticaFont: any,
  helveticaBoldFont: any,
  timesFont: any
): Promise<void> {
  const field = replacement.field;
  const newValue = replacement.new_value || '';

  if (!newValue || !pdfStructure.placeholderPositions[field]) {
    console.log(`Skipping replacement for ${field}: no value or position`);
    return;
  }

  const position = pdfStructure.placeholderPositions[field];

  // Configurações específicas por campo
  let font = helveticaFont;
  let fontSize = 11;
  let lineHeight = 14;
  let maxWidth = position.width;

  switch (field) {
    case 'NUMERO_INDICACAO':
      font = helveticaBoldFont;
      fontSize = 12;
      break;
    case 'TITULO':
      font = helveticaBoldFont;
      fontSize = 12;
      break;
    case 'JUSTIFICATIVA':
      font = timesFont;
      fontSize = 11;
      lineHeight = 16;
      break;
    case 'DATA':
      font = helveticaFont;
      fontSize = 10;
      break;
    case 'AUTOR':
      font = helveticaBoldFont;
      fontSize = 11;
      break;
    case 'ENDERECO':
      font = helveticaFont;
      fontSize = 11;
      break;
  }

  // Limpar a área antes de escrever (desenha retângulo branco)
  page.drawRectangle({
    x: position.x - 5,
    y: position.y - 5,
    width: position.width + 10,
    height: position.height + 10,
    color: rgb(1, 1, 1), // Branco
  });

  // Para campos de texto longo (como justificativa), quebrar em linhas
  if (field === 'JUSTIFICATIVA' && newValue.length > 100) {
    const lines = wrapText(newValue, maxWidth, font, fontSize);
    let currentY = position.y + position.height - lineHeight;

    for (const line of lines.slice(0, 10)) { // Limitar a 10 linhas
      if (currentY < position.y - 10) break; // Não ultrapassar o espaço

      page.drawText(line, {
        x: position.x,
        y: currentY,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
        maxWidth: maxWidth
      });

      currentY -= lineHeight;
    }
  } else {
    // Para campos de texto simples
    let displayText = newValue;

    // Truncar texto se necessário
    if (font.widthOfTextAtSize(displayText, fontSize) > maxWidth) {
      while (font.widthOfTextAtSize(displayText + '...', fontSize) > maxWidth && displayText.length > 0) {
        displayText = displayText.slice(0, -1);
      }
      displayText += '...';
    }

    page.drawText(displayText, {
      x: position.x,
      y: position.y + (position.height / 2) - (fontSize / 2),
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
      maxWidth: maxWidth
    });
  }
}

async function addPhotoGalleryPage(pdfDoc: PDFDocument, photoUrls: string[]) {
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText('GALERIA DE FOTOS - ANEXO', {
    x: 50,
    y: height - 50,
    size: 14,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0)
  });

  let currentY = height - 100;
  const imageWidth = (width - 150) / 2;
  const imageHeight = 200;

  for (let i = 0; i < photoUrls.length; i++) {
    try {
      const photoResponse = await fetch(photoUrls[i]);
      const photoBytes = await photoResponse.arrayBuffer();

      let image;
      if (photoUrls[i].toLowerCase().endsWith('.png')) {
        image = await pdfDoc.embedPng(photoBytes);
      } else {
        image = await pdfDoc.embedJpg(photoBytes);
      }

      const xPos = i % 2 === 0 ? 50 : 50 + imageWidth + 50;

      page.drawImage(image, {
        x: xPos,
        y: currentY - imageHeight,
        width: imageWidth,
        height: imageHeight
      });

      if (i % 2 !== 0) {
        currentY -= (imageHeight + 40);
      }

      // Se estourar a página, adicionar nova
      if (currentY < 100 && i < photoUrls.length - 1) {
        // (Aqui poderíamos adicionar lógica recursiva para novas páginas se necessário)
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', photoUrls[i], error);
    }
  }
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Palavra muito longa, forçar quebra
        lines.push(word);
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
