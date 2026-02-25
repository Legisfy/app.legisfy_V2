export interface GenderArticles {
  article: string; // "do" | "da" | "do(a)"
  position: string; // "Vereador" | "Vereadora" | "Vereador(a)"
}

export const getGenderArticles = (gender: string, position: 'Vereador' | 'Deputado'): GenderArticles => {
  const normalizedGender = gender?.toLowerCase().trim();
  
  if (normalizedGender === 'feminino' || normalizedGender === 'f') {
    return {
      article: 'da',
      position: position === 'Vereador' ? 'Vereadora' : 'Deputada'
    };
  }
  
  if (normalizedGender === 'nao_binario' || normalizedGender === 'não binário' || normalizedGender === 'nb') {
    return {
      article: 'do(a)',
      position: position === 'Vereador' ? 'Vereador(a)' : 'Deputado(a)'
    };
  }
  
  // Default to masculine (masculino or any other value)
  return {
    article: 'do',
    position: position
  };
};

export const formatCabinetName = (
  politicianName: string, 
  chamberType: string, 
  gender?: string
): string => {
  // Extract short name (first + last name)
  const getShortName = (fullName: string) => {
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    if (names.length <= 2) return fullName;
    return `${names[0]} ${names[names.length - 1]}`;
  };

  const shortName = getShortName(politicianName);
  const positionType = chamberType === 'estadual' ? 'Deputado' : 'Vereador';
  const { article, position } = getGenderArticles(gender || '', positionType as 'Vereador' | 'Deputado');
  
  return `Gabinete ${article} ${position} ${shortName}`.trim();
};