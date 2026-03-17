/**
 * Utilidades para generación y validación de contraseñas seguras
 */

// Caracteres para generar contraseñas seguras
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SPECIAL = '!@#$%&*';

/**
 * Genera una contraseña segura aleatoria
 * @param length Longitud de la contraseña (mínimo 12, por defecto 16)
 * @returns Contraseña generada
 */
export function generateSecurePassword(length: number = 16): string {
  const minLength = 12;
  const finalLength = Math.max(length, minLength);

  // Asegurar al menos un caracter de cada tipo
  const password: string[] = [
    UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)],
    LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)],
    NUMBERS[Math.floor(Math.random() * NUMBERS.length)],
    SPECIAL[Math.floor(Math.random() * SPECIAL.length)],
  ];

  // Completar el resto con caracteres aleatorios de todos los tipos
  const allChars = UPPERCASE + LOWERCASE + NUMBERS + SPECIAL;
  for (let i = password.length; i < finalLength; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Mezclar los caracteres para que no siempre estén en el mismo orden
  return shuffleArray(password).join('');
}

/**
 * Mezcla un array usando el algoritmo Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Valida que una contraseña cumpla con los requisitos de seguridad
 * @param password Contraseña a validar
 * @returns Objeto con resultado y mensaje de error si aplica
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }

  if (!/[!@#$%&*]/.test(password)) {
    errors.push('Debe contener al menos un caracter especial (!@#$%&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
