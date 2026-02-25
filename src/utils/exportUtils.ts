export interface EleitorExport {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  bairro: string;
  sexo: string;
  profissao: string;
  tags: string[];
  indicacoes: number;
  demandas: number;
  indicacoesAtendidas: number;
  demandasAtendidas: number;
}

export const exportToCSV = (eleitores: EleitorExport[], filename: string = 'eleitores') => {
  // Cabeçalhos da planilha
  const headers = [
    'Nome',
    'Email', 
    'Telefone',
    'Endereço',
    'Bairro',
    'Sexo',
    'Profissão',
    'Tags',
    'Indicações',
    'Demandas',
    'Indicações Atendidas',
    'Demandas Atendidas',
    'Status'
  ];

  // Converter dados para CSV
  const csvContent = [
    headers.join(','),
    ...eleitores.map(eleitor => {
      const totalItens = eleitor.indicacoes + eleitor.demandas;
      const totalAtendidos = eleitor.indicacoesAtendidas + eleitor.demandasAtendidas;
      const status = totalItens === 0 ? 'Sem demandas' : (totalAtendidos === totalItens ? 'Atendido' : 'Pendente');
      
      return [
        `"${eleitor.nome}"`,
        `"${eleitor.email}"`,
        `"${eleitor.telefone}"`,
        `"${eleitor.endereco}"`,
        `"${eleitor.bairro}"`,
        `"${eleitor.sexo}"`,
        `"${eleitor.profissao}"`,
        `"${eleitor.tags.join(', ')}"`,
        eleitor.indicacoes,
        eleitor.demandas,
        eleitor.indicacoesAtendidas,
        eleitor.demandasAtendidas,
        `"${status}"`
      ].join(',');
    })
  ].join('\n');

  // Criar e baixar arquivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportFilteredEleitores = (
  eleitores: EleitorExport[], 
  searchTerm: string, 
  selectedBairro: string, 
  selectedTag: string
) => {
  const filteredEleitores = eleitores.filter(eleitor => {
    const matchesSearch = eleitor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eleitor.bairro.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBairro = selectedBairro === "Bairro" || eleitor.bairro === selectedBairro;
    const matchesTag = selectedTag === "Tag" || eleitor.tags.includes(selectedTag);
    
    return matchesSearch && matchesBairro && matchesTag;
  });

  const filename = `eleitores_filtrados_${new Date().toISOString().split('T')[0]}`;
  exportToCSV(filteredEleitores, filename);
};