import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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

  try {
    const { action, ...params } = await req.json();

    switch (action) {
      case 'generate-pdf':
        return await handleGeneratePdf(params);
      case 'test-template':
        return await handleTestTemplate(params);
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in pdf-processor:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Processing failed', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleGeneratePdf(params: any) {
  const { templateId, indicacaoData, gabineteName } = params;
  
  if (!templateId || !indicacaoData) {
    throw new Error('Template ID and indicacao data are required');
  }

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Generating PDF for template:', templateId);

  // Buscar o template
  const { data: template, error: templateError } = await supabase
    .from('document_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError || !template) {
    throw new Error('Template not found');
  }

  // Validar dados de entrada
  const validationErrors = validateIndicacaoData(indicacaoData);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  // Gerar número sequencial
  const { data: existingIndicacoes } = await supabase
    .from('indicacoes')
    .select('id')
    .eq('gabinete_id', template.gabinete_id)
    .order('created_at', { ascending: false });

  const numeroIndicacao = `${String(existingIndicacoes?.length + 1 || 1).padStart(3, '0')}/${new Date().getFullYear()}`;

  // Preparar dados para substituição
  const replacementData = {
    NUMERO_INDICACAO: numeroIndicacao,
    ENDERECO: formatarEndereco(indicacaoData.endereco || ''),
    JUSTIFICATIVA: await corrigirTextoComIA(indicacaoData.justificativa || '', openaiApiKey),
    DATA: formatarDataPorExtenso(new Date()),
    AUTOR: gabineteName || 'Nome do Vereador',
    NOME_GABINETE: gabineteName || 'Nome do Gabinete'
  };

  console.log('Replacement data prepared:', replacementData);

  // Gerar PDF usando HTML como intermediário (mais confiável)
  const generatedPdfUrl = await generatePdfFromTemplate(
    template.original_pdf_url,
    template.template_analysis,
    replacementData,
    openaiApiKey,
    supabase
  );

  // Registrar no banco
  const { data: generation, error: generationError } = await supabase
    .from('document_generations')
    .insert({
      template_id: templateId,
      gabinete_id: template.gabinete_id,
      related_entity_type: 'indicacao',
      related_entity_id: indicacaoData.id,
      variables_used: replacementData,
      generated_pdf_url: generatedPdfUrl,
      generation_status: 'success',
      created_by: indicacaoData.user_id
    })
    .select()
    .single();

  return new Response(
    JSON.stringify({ 
      success: true,
      generatedPdfUrl,
      numeroIndicacao,
      replacementData,
      generationId: generation?.id
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleTestTemplate(params: any) {
  const { templateId } = params;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Buscar template
  const { data: template } = await supabase
    .from('document_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (!template) {
    throw new Error('Template not found');
  }

  // Dados de teste
  const testData = {
    NUMERO_INDICACAO: '001/2025',
    ENDERECO: 'Rua das Flores, 123, Centro, Vitória – ES, 29000-000',
    JUSTIFICATIVA: 'Esta é uma justificativa de teste para verificar a funcionalidade de geração automática de documentos.',
    DATA: 'Vitória, 25 de janeiro de 2025',
    AUTOR: 'Vereador Teste',
    NOME_GABINETE: 'Gabinete do Vereador Teste'
  };

  console.log('Testing template with data:', testData);

  return new Response(
    JSON.stringify({ 
      success: true,
      template_analysis: template.template_analysis,
      test_data: testData,
      message: 'Template ready for testing'
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

function validateIndicacaoData(data: any): string[] {
  const errors = [];
  
  if (!data.endereco || data.endereco.length < 10) {
    errors.push('Endereço completo obrigatório');
  }
  
  if (!data.justificativa || data.justificativa.length < 300) {
    errors.push('Justificativa deve ter pelo menos 300 caracteres');
  }
  
  return errors;
}

function formatarEndereco(endereco: string): string {
  return endereco
    .replace(/\bR\./gi, 'Rua')
    .replace(/\bAv\./gi, 'Avenida')
    .replace(/\bStr\./gi, 'Rua')
    .replace(/\bTrav\./gi, 'Travessa')
    .replace(/\bPç\./gi, 'Praça');
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

async function corrigirTextoComIA(texto: string, apiKey: string): Promise<string> {
  if (!texto || texto.length < 10) {
    return texto;
  }

  const prompt = `
Corrija ortográfica e gramaticalmente este texto, mantendo o tom formal adequado para uma indicação municipal.
Garanta que tenha entre 1-5 parágrafos, removendo redundâncias.

Texto:
${texto}

Retorne apenas o texto corrigido.
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

  return texto;
}

async function generatePdfFromTemplate(
  originalPdfUrl: string,
  analysis: any,
  replacementData: any,
  apiKey: string,
  supabase: any
): Promise<string> {
  
  console.log('Generating PDF with replacement data:', replacementData);
  
  try {
    // Gerar HTML baseado no template e dados
    const htmlContent = await generateHtmlFromTemplate(analysis, replacementData, apiKey);
    
    // Converter HTML para PDF (simulação - em produção use puppeteer ou similar)
    const pdfBlob = await convertHtmlToPdf(htmlContent);
    
    // Upload do PDF gerado
    const fileName = `generated/indicacao-${Date.now()}.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    const generatedUrl = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName).data.publicUrl;
    
    console.log('PDF generated and uploaded:', generatedUrl);
    return generatedUrl;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback: retorna o PDF original
    return originalPdfUrl;
  }
}

async function generateHtmlFromTemplate(analysis: any, data: any, apiKey: string): Promise<string> {
  const prompt = `
Gere um documento HTML completo de uma INDICAÇÃO MUNICIPAL usando os dados fornecidos.
O documento deve ter formatação profissional similar a documentos oficiais.

DADOS PARA O DOCUMENTO:
${JSON.stringify(data, null, 2)}

ESTRUTURA ESPERADA:
- Cabeçalho com "CÂMARA MUNICIPAL DE VITÓRIA"
- Título "INDICAÇÃO Nº ${data.NUMERO_INDICACAO}"
- Corpo do documento com o endereço e justificativa
- Data e assinatura no final

Gere um HTML completo, bem formatado, pronto para conversão em PDF.
Use CSS inline para garantir boa formatação.
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
        { role: 'system', content: 'Você é um especialista em geração de documentos oficiais HTML.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.1
    }),
  });

  if (response.ok) {
    const result = await response.json();
    return result.choices[0].message.content;
  }
  
  // Fallback HTML
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .header { text-align: center; font-weight: bold; margin-bottom: 30px; }
    .title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
    .content { text-align: justify; margin: 20px 0; }
    .footer { margin-top: 40px; text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <h2>CÂMARA MUNICIPAL DE VITÓRIA</h2>
    <h3>GABINETE DO VEREADOR</h3>
  </div>
  
  <div class="title">
    INDICAÇÃO Nº ${data.NUMERO_INDICACAO}
  </div>
  
  <div class="content">
    <p>Senhor Presidente,</p>
    
    <p>Por meio desta, venho respeitosamente submeter à apreciação desta Casa Legislativa a seguinte indicação para o endereço: <strong>${data.ENDERECO}</strong></p>
    
    <p><strong>JUSTIFICATIVA:</strong></p>
    <p>${data.JUSTIFICATIVA}</p>
    
    <p>Nestes termos, pede e espera deferimento.</p>
  </div>
  
  <div class="footer">
    <p>${data.DATA}</p>
    <br><br>
    <p>_______________________________</p>
    <p><strong>${data.AUTOR}</strong></p>
    <p>Vereador</p>
  </div>
</body>
</html>
  `;
}

async function convertHtmlToPdf(htmlContent: string): Promise<Blob> {
  // Simulação da conversão HTML para PDF
  // Em produção, você usaria bibliotecas como puppeteer
  
  console.log('Converting HTML to PDF (simulated)');
  
  // Por enquanto, retorna um blob com o HTML como texto
  // TODO: Implementar conversão real HTML->PDF
  return new Blob([htmlContent], { type: 'application/pdf' });
}