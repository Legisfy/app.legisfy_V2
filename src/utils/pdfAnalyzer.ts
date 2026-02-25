import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js para funcionar corretamente
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

interface AnalyzedPDF {
  textosPadrao: {
    cabecalho: string;
    rodape: string;
    assinatura: string;
  };
  template: string; // Base64 da primeira página como template
  tipo: "indicacao" | "oficio" | "projeto-lei" | "mocao";
  nome: string;
}

export class PDFAnalyzer {
  private static detectarTipo(texto: string): "indicacao" | "oficio" | "projeto-lei" | "mocao" {
    const textoLimpo = texto.toLowerCase();
    
    if (textoLimpo.includes('indicação') || textoLimpo.includes('indicacao')) {
      return 'indicacao';
    }
    if (textoLimpo.includes('ofício') || textoLimpo.includes('oficio')) {
      return 'oficio';
    }
    if (textoLimpo.includes('projeto de lei') || textoLimpo.includes('projeto-de-lei')) {
      return 'projeto-lei';
    }
    if (textoLimpo.includes('moção') || textoLimpo.includes('mocao')) {
      return 'mocao';
    }
    
    // Default para indicação se não conseguir detectar
    return 'indicacao';
  }

  private static extrairCabecalho(texto: string): string {
    const linhas = texto.split('\n').filter(linha => linha.trim());
    
    // Procurar por padrões de cabeçalho
    for (let i = 0; i < Math.min(10, linhas.length); i++) {
      const linha = linhas[i].trim();
      
      // Detectar padrões como "INDICAÇÃO Nº 001/2024", "OFÍCIO Nº 123/2024", etc.
      if (/^(INDICAÇÃO|OFÍCIO|PROJETO DE LEI|MOÇÃO)\s*N[ºo°]\s*\d+\/\d{4}/i.test(linha)) {
        // Substituir número específico por XXX para tornar genérico
        return linha.replace(/\d+\/\d{4}/, 'XXX/2024');
      }
      
      // Detectar outros padrões de cabeçalho
      if (linha.includes('INDICAÇÃO') || linha.includes('OFÍCIO') || 
          linha.includes('PROJETO') || linha.includes('MOÇÃO')) {
        return linha.replace(/\d+/g, 'XXX');
      }
    }
    
    // Fallback: usar primeira linha como cabeçalho
    return linhas[0] || 'DOCUMENTO Nº XXX/2024';
  }

  private static extrairRodape(texto: string): string {
    const linhas = texto.split('\n').filter(linha => linha.trim());
    const ultimasLinhas = linhas.slice(-10);
    
    // Procurar por padrões de rodapé
    for (const linha of ultimasLinhas.reverse()) {
      const linhaLimpa = linha.trim();
      
      // Detectar padrões como "Gabinete do Vereador", "Câmara Municipal", etc.
      if (linhaLimpa.includes('Gabinete') || linhaLimpa.includes('Câmara') || 
          linhaLimpa.includes('Vereador') || linhaLimpa.includes('Prefeitura')) {
        return linhaLimpa;
      }
    }
    
    return 'Gabinete do Vereador';
  }

  private static extrairAssinatura(texto: string): string {
    const linhas = texto.split('\n').filter(linha => linha.trim());
    const ultimasLinhas = linhas.slice(-15);
    
    let assinatura = '';
    let encontrouLinhaDivisoria = false;
    
    // Procurar por padrões de assinatura (normalmente após uma linha divisória ou espaço)
    for (let i = ultimasLinhas.length - 1; i >= 0; i--) {
      const linha = ultimasLinhas[i].trim();
      
      // Detectar linha divisória ou espaço significativo
      if (linha.includes('___') || linha.includes('---') || linha === '') {
        encontrouLinhaDivisoria = true;
        continue;
      }
      
      if (encontrouLinhaDivisoria) {
        // Detectar nome e cargo
        if (linha.includes('Vereador') || linha.includes('Prefeito') || 
            linha.includes('Secretário') || linha.includes('Deputado')) {
          assinatura = linha + (assinatura ? '\n' + assinatura : '');
        } else if (linha.length > 5 && linha.length < 50) {
          // Provável nome
          assinatura = linha + (assinatura ? '\n' + assinatura : '');
        }
      }
    }
    
    return assinatura || 'Nome do Responsável\nCargo';
  }

  private static gerarNomeModelo(tipo: string, texto: string): string {
    const tipoMap = {
      'indicacao': 'Indicação',
      'oficio': 'Ofício',
      'projeto-lei': 'Projeto de Lei',
      'mocao': 'Moção'
    };
    
    // Tentar extrair instituição do texto
    const linhas = texto.split('\n');
    for (const linha of linhas) {
      if (linha.includes('Gabinete') || linha.includes('Câmara') || 
          linha.includes('Prefeitura')) {
        const palavras = linha.split(' ');
        const instituicao = palavras.slice(-2).join(' '); // Últimas 2 palavras
        return `Modelo ${tipoMap[tipo as keyof typeof tipoMap]} - ${instituicao}`;
      }
    }
    
    return `Modelo ${tipoMap[tipo as keyof typeof tipoMap]} Oficial`;
  }

  private static async converterPDFParaImagem(pdfDoc: any): Promise<string> {
    try {
      // Pegar primeira página
      const page = await pdfDoc.getPage(1);
      const scale = 2; // Aumentar resolução
      const viewport = page.getViewport({ scale });

      // Criar canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Renderizar página no canvas
      const renderContext = {
        canvasContext: context!,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      
      // Converter para base64
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.warn('Erro ao converter PDF para imagem:', error);
      return '';
    }
  }

  public static async analisarPDF(file: File): Promise<AnalyzedPDF> {
    try {
      // Converter arquivo para ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Carregar PDF
      const pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      // Extrair texto de todas as páginas
      let textoCompleto = '';
      const numPages = pdfDoc.numPages;
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        textoCompleto += pageText + '\n';
      }

      // Converter primeira página para imagem (template)
      const template = await this.converterPDFParaImagem(pdfDoc);

      // Analisar e extrair informações
      const tipo = this.detectarTipo(textoCompleto);
      const cabecalho = this.extrairCabecalho(textoCompleto);
      const rodape = this.extrairRodape(textoCompleto);
      const assinatura = this.extrairAssinatura(textoCompleto);
      const nome = this.gerarNomeModelo(tipo, textoCompleto);

      return {
        textosPadrao: {
          cabecalho,
          rodape,
          assinatura
        },
        template,
        tipo,
        nome
      };
    } catch (error) {
      console.error('Erro ao analisar PDF:', error);
      throw new Error('Erro ao processar o arquivo PDF. Verifique se o arquivo não está corrompido.');
    }
  }
}