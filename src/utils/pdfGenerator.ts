import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ModeloDocumento {
  id: string;
  nome: string;
  tipo: "indicacao" | "oficio" | "projeto-lei" | "mocao";
  template: string;
  textosPadrao: {
    cabecalho: string;
    rodape: string;
    assinatura: string;
  };
  ativo: boolean;
}

interface IndicacaoData {
  title: string;
  description: string;
  address: string;
  bairro: string;
  cep: string;
  tags: string;
  comments: string;
  numero?: string;
}

export class PDFGenerator {
  private modelo: ModeloDocumento;
  private indicacao: IndicacaoData;

  constructor(modelo: ModeloDocumento, indicacao: IndicacaoData) {
    this.modelo = modelo;
    this.indicacao = indicacao;
  }

  private gerarNumeroDocumento(): string {
    // Gera um número sequencial baseado na data atual
    const agora = new Date();
    const ano = agora.getFullYear();
    const numeroSequencial = Math.floor(Math.random() * 1000) + 1; // Mock - implementar numeração sequencial real
    return `${numeroSequencial.toString().padStart(3, '0')}/${ano}`;
  }

  private substituirVariaveis(texto: string): string {
    const numero = this.indicacao.numero || this.gerarNumeroDocumento();
    
    return texto
      .replace(/XXX/g, numero)
      .replace(/\{TITULO\}/g, this.indicacao.title)
      .replace(/\{ENDERECO\}/g, this.indicacao.address)
      .replace(/\{BAIRRO\}/g, this.indicacao.bairro)
      .replace(/\{CEP\}/g, this.indicacao.cep)
      .replace(/\{DATA\}/g, new Date().toLocaleDateString('pt-BR'));
  }

  private async gerarConteudoHTML(): Promise<string> {
    const cabecalho = this.substituirVariaveis(this.modelo.textosPadrao.cabecalho);
    const rodape = this.substituirVariaveis(this.modelo.textosPadrao.rodape);
    const assinatura = this.substituirVariaveis(this.modelo.textosPadrao.assinatura);

    // Template HTML com layout profissional
    return `
      <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white;">
        <!-- Cabeçalho -->
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="font-size: 18px; font-weight: bold; margin: 0; text-transform: uppercase;">
            ${cabecalho}
          </h1>
        </div>

        <!-- Conteúdo Principal -->
        <div style="margin-bottom: 40px; line-height: 1.8; text-align: justify;">
          <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase;">
            ${this.indicacao.title}
          </h2>
          
          <div style="margin-bottom: 20px;">
            <strong>Endereço:</strong> ${this.indicacao.address}, ${this.indicacao.bairro}
            ${this.indicacao.cep ? ` - CEP: ${this.indicacao.cep}` : ''}
          </div>

          <div style="margin-bottom: 20px;">
            <strong>Justificativa:</strong>
          </div>
          
          <p style="text-indent: 2em; margin-bottom: 15px;">
            ${this.indicacao.description}
          </p>

          ${this.indicacao.comments ? `
            <div style="margin-top: 30px;">
              <strong>Observações:</strong>
              <p style="text-indent: 2em; margin-top: 10px;">
                ${this.indicacao.comments}
              </p>
            </div>
          ` : ''}

          ${this.indicacao.tags ? `
            <div style="margin-top: 20px;">
              <strong>Tags:</strong> ${this.indicacao.tags}
            </div>
          ` : ''}
        </div>

        <!-- Data e Local -->
        <div style="margin-bottom: 60px; text-align: right;">
          <p style="margin: 0;">
            Cidade, ${new Date().toLocaleDateString('pt-BR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}.
          </p>
        </div>

        <!-- Assinatura -->
        <div style="text-align: center; margin-top: 80px;">
          <div style="border-top: 1px solid #333; width: 300px; margin: 0 auto 10px;">
          </div>
          <div style="white-space: pre-line; font-weight: bold;">
            ${assinatura}
          </div>
        </div>

        <!-- Rodapé -->
        <div style="margin-top: 60px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
          ${rodape}
        </div>
      </div>
    `;
  }

  public async gerarPDF(): Promise<Blob> {
    try {
      // Criar elemento temporário com o conteúdo
      const conteudoHTML = await this.gerarConteudoHTML();
      const elementoTemp = document.createElement('div');
      elementoTemp.innerHTML = conteudoHTML;
      elementoTemp.style.position = 'absolute';
      elementoTemp.style.top = '-9999px';
      elementoTemp.style.left = '-9999px';
      document.body.appendChild(elementoTemp);

      // Configurar html2canvas
      const canvas = await html2canvas(elementoTemp, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        width: 800,
        height: 1200
      });

      // Remover elemento temporário
      document.body.removeChild(elementoTemp);

      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Adicionar template de fundo se existir
      if (this.modelo.template && this.modelo.template.startsWith('data:')) {
        try {
          pdf.addImage(this.modelo.template, 'PNG', 0, 0, 210, 297);
        } catch (error) {
          console.warn('Erro ao adicionar template de fundo:', error);
        }
      }

      // Adicionar conteúdo
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Adicionar primeira página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Adicionar páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        
        // Adicionar template de fundo nas páginas adicionais
        if (this.modelo.template && this.modelo.template.startsWith('data:')) {
          try {
            pdf.addImage(this.modelo.template, 'PNG', 0, 0, 210, 297);
          } catch (error) {
            console.warn('Erro ao adicionar template de fundo na página adicional:', error);
          }
        }
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Erro ao gerar o documento PDF');
    }
  }

  public async baixarPDF(nomeArquivo?: string): Promise<void> {
    const blob = await this.gerarPDF();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo || `${this.modelo.tipo}_${this.indicacao.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// Função auxiliar para buscar modelos ativos
export const buscarModelosAtivos = (): ModeloDocumento[] => {
  // Por enquanto usando mock - implementar integração com Supabase posteriormente
  // Esta função será substituída por uma busca real na base de dados
  const modelosLocal = localStorage.getItem('modelos-documentos');
  if (modelosLocal) {
    try {
      const modelos = JSON.parse(modelosLocal);
      return modelos.filter((m: ModeloDocumento) => m.ativo);
    } catch {
      // Se houver erro no parse, retorna modelo padrão
    }
  }
  
  // Fallback para modelo padrão
  return [
    {
      id: "1",
      nome: "Modelo Oficial Indicação",
      tipo: "indicacao",
      template: "",
      textosPadrao: {
        cabecalho: "INDICAÇÃO Nº XXX/2024",
        rodape: "Gabinete do Vereador",
        assinatura: "Vereador(a)\nCâmara Municipal"
      },
      ativo: true
    }
  ];
};

// Função para buscar modelo específico por tipo
export const buscarModeloPorTipo = (tipo: string): ModeloDocumento | null => {
  const modelos = buscarModelosAtivos();
  return modelos.find(modelo => modelo.tipo === tipo && modelo.ativo) || null;
};