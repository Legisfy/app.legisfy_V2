import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { useActiveInstitution } from './useActiveInstitution';
import { normalizeForStorage, areEquivalentStrings } from '@/utils/textNormalization';

export interface FieldValidationResult {
  isValid: boolean;
  isDuplicate: boolean;
  errorMessage?: string;
  normalizedValue?: string;
}

export const useNormalizedFields = () => {
  const { user } = useAuthContext();
  const { activeInstitution } = useActiveInstitution();
  const [loading, setLoading] = useState(false);

  /**
   * Validate neighborhood field for duplicates
   */
  const validateNeighborhood = useCallback(async (
    value: string,
    excludeId?: string
  ): Promise<FieldValidationResult> => {
    if (!value.trim()) {
      return { isValid: true, isDuplicate: false };
    }

    if (!activeInstitution) {
      return {
        isValid: false,
        isDuplicate: false,
        errorMessage: 'Instituição não encontrada'
      };
    }

    setLoading(true);
    
    try {
      const normalizedValue = normalizeForStorage(value);
      
      // Query eleitores for existing neighborhoods
      let query = supabase
        .from('eleitores')
        .select('id, neighborhood')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .not('neighborhood', 'is', null);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error validating neighborhood:', error);
        return {
          isValid: false,
          isDuplicate: false,
          errorMessage: 'Erro ao validar bairro'
        };
      }

      // Check for duplicates using normalized comparison
      const isDuplicate = data?.some(record => {
        const existingNeighborhood = record.neighborhood;
        return existingNeighborhood && areEquivalentStrings(existingNeighborhood, value);
      }) || false;

      return {
        isValid: !isDuplicate,
        isDuplicate,
        normalizedValue,
        errorMessage: isDuplicate ? 'Esse bairro já existe' : undefined
      };
    } catch (error) {
      console.error('Error in validateNeighborhood:', error);
      return {
        isValid: false,
        isDuplicate: false,
        errorMessage: 'Erro ao validar bairro'
      };
    } finally {
      setLoading(false);
    }
  }, [activeInstitution]);

  /**
   * Validate profession field for duplicates
   */
  const validateProfession = useCallback(async (
    value: string,
    excludeId?: string
  ): Promise<FieldValidationResult> => {
    if (!value.trim()) {
      return { isValid: true, isDuplicate: false };
    }

    if (!activeInstitution) {
      return {
        isValid: false,
        isDuplicate: false,
        errorMessage: 'Instituição não encontrada'
      };
    }

    setLoading(true);
    
    try {
      const normalizedValue = normalizeForStorage(value);
      
      // Query eleitores for existing professions
      let query = supabase
        .from('eleitores')
        .select('id, profession')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .not('profession', 'is', null);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error validating profession:', error);
        return {
          isValid: false,
          isDuplicate: false,
          errorMessage: 'Erro ao validar profissão'
        };
      }

      // Check for duplicates using normalized comparison
      const isDuplicate = data?.some(record => {
        const existingProfession = record.profession;
        return existingProfession && areEquivalentStrings(existingProfession, value);
      }) || false;

      return {
        isValid: !isDuplicate,
        isDuplicate,
        normalizedValue,
        errorMessage: isDuplicate ? 'Essa profissão já existe' : undefined
      };
    } catch (error) {
      console.error('Error in validateProfession:', error);
      return {
        isValid: false,
        isDuplicate: false,
        errorMessage: 'Erro ao validar profissão'
      };
    } finally {
      setLoading(false);
    }
  }, [activeInstitution]);

  /**
   * Get existing neighborhoods
   */
  const getExistingNeighborhoods = useCallback(async (excludeId?: string): Promise<string[]> => {
    if (!activeInstitution) {
      return [];
    }

    try {
      let query = supabase
        .from('eleitores')
        .select('neighborhood')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .not('neighborhood', 'is', null);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching existing neighborhoods:', error);
        return [];
      }

      return data?.map(record => record.neighborhood).filter(Boolean) || [];
    } catch (error) {
      console.error('Error in getExistingNeighborhoods:', error);
      return [];
    }
  }, [activeInstitution]);

  /**
   * Get existing professions
   */
  const getExistingProfessions = useCallback(async (excludeId?: string): Promise<string[]> => {
    if (!activeInstitution) {
      return [];
    }

    try {
      let query = supabase
        .from('eleitores')
        .select('profession')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .not('profession', 'is', null);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching existing professions:', error);
        return [];
      }

      return data?.map(record => record.profession).filter(Boolean) || [];
    } catch (error) {
      console.error('Error in getExistingProfessions:', error);
      return [];
    }
  }, [activeInstitution]);

  return {
    loading,
    validateNeighborhood,
    validateProfession,
    getExistingNeighborhoods,
    getExistingProfessions,
  };
};