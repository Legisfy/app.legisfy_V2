/**
 * Utilities for text normalization and validation
 */

/**
 * Remove accents from text
 */
export const removeAccents = (text: string): string => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Normalize text for storage and comparison
 * - Convert to lowercase
 * - Remove accents
 * - Remove special characters except spaces
 * - Trim and remove extra spaces
 */
export const normalizeForStorage = (text: string): string => {
  if (!text) return '';
  
  return removeAccents(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters except spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

/**
 * Format text for display
 * - First letter uppercase, rest lowercase
 */
export const formatForDisplay = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
};

/**
 * Check if two strings are equivalent after normalization
 */
export const areEquivalentStrings = (str1: string, str2: string): boolean => {
  return normalizeForStorage(str1) === normalizeForStorage(str2);
};

/**
 * Normalize phone number for comparison
 * - Remove all non-numeric characters
 * - Standardize format
 */
export const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const numbersOnly = phone.replace(/\D/g, '');
  
  // Add country code if missing (Brazil +55)
  if (numbersOnly.length === 11 && !numbersOnly.startsWith('55')) {
    return '55' + numbersOnly;
  }
  
  if (numbersOnly.length === 10 && !numbersOnly.startsWith('55')) {
    return '55' + numbersOnly;
  }
  
  return numbersOnly;
};

/**
 * Normalize email for comparison
 */
export const normalizeEmail = (email: string): string => {
  if (!email) return '';
  return email.toLowerCase().trim();
};

/**
 * Format phone for display
 */
export const formatPhoneDisplay = (phone: string): string => {
  if (!phone) return '';
  
  const numbersOnly = phone.replace(/\D/g, '');
  
  // Format as (XX) XXXXX-XXXX for Brazilian numbers
  if (numbersOnly.length >= 10) {
    let formatted = numbersOnly;
    
    // Remove country code for display if present
    if (formatted.length === 13 && formatted.startsWith('55')) {
      formatted = formatted.substring(2);
    }
    
    if (formatted.length === 11) {
      return `(${formatted.substring(0, 2)}) ${formatted.substring(2, 7)}-${formatted.substring(7)}`;
    }
    
    if (formatted.length === 10) {
      return `(${formatted.substring(0, 2)}) ${formatted.substring(2, 6)}-${formatted.substring(6)}`;
    }
  }
  
  return phone;
};