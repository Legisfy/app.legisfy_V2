export const getAvatarColor = (sex?: string) => {
  switch (sex?.toLowerCase()) {
    case 'masculino':
      return 'bg-blue-500';
    case 'feminino':
      return 'bg-pink-500';
    case 'nao_binario':
      return 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500';
    default:
      return 'bg-gray-500';
  }
};

export const getAvatarInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};