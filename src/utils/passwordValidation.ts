export interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
  met?: boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'Pelo menos 8 caracteres',
    test: (password: string) => password.length >= 8
  },
  {
    id: 'uppercase',
    label: 'Pelo menos uma letra maiúscula (A-Z)',
    test: (password: string) => /[A-Z]/.test(password)
  },
  {
    id: 'lowercase',
    label: 'Pelo menos uma letra minúscula (a-z)',
    test: (password: string) => /[a-z]/.test(password)
  },
  {
    id: 'number',
    label: 'Pelo menos um número (0-9)',
    test: (password: string) => /[0-9]/.test(password)
  },
  {
    id: 'special',
    label: 'Pelo menos um caractere especial (!@#$%^&*)',
    test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
];

export const validatePassword = (password: string): {
  isValid: boolean;
  requirements: PasswordRequirement[];
  strength: number;
} => {
  const results = passwordRequirements.map(req => ({
    ...req,
    met: req.test(password)
  }));

  const metCount = results.filter(req => req.met).length;
  const isValid = metCount === passwordRequirements.length;
  const strength = Math.floor((metCount / passwordRequirements.length) * 100);

  return {
    isValid,
    requirements: results,
    strength
  };
};