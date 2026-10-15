/**
 * Utilitários para filtragem, máscara e validação de CNPJ
 * Estética editorial Unbora - Zero Emojis
 */

export function cleanCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskCnpj(value: string): string {
  const digits = cleanCnpj(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function isValidCnpj(value: string): boolean {
  const digits = cleanCnpj(value);
  if (digits.length !== 14) return false;

  // Rejeita sequências de dígitos idênticos (ex: 00000000000000, 11111111111111, etc.)
  if (/^(\d)\1{13}$/.test(digits)) return false;

  // Primeiro dígito verificador
  const weightsFirst = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sumFirst = 0;
  for (let i = 0; i < 12; i++) {
    sumFirst += Number(digits[i]) * weightsFirst[i];
  }
  const remFirst = sumFirst % 11;
  const firstVerifier = remFirst < 2 ? 0 : 11 - remFirst;
  if (Number(digits[12]) !== firstVerifier) return false;

  // Segundo dígito verificador
  const weightsSecond = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sumSecond = 0;
  for (let i = 0; i < 13; i++) {
    sumSecond += Number(digits[i]) * weightsSecond[i];
  }
  const remSecond = sumSecond % 11;
  const secondVerifier = remSecond < 2 ? 0 : 11 - remSecond;
  if (Number(digits[13]) !== secondVerifier) return false;

  return true;
}
