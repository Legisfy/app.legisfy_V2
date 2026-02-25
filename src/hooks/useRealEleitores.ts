import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { useActiveInstitution } from './useActiveInstitution';
import { Database } from '@/integrations/supabase/types';
import { normalizeForStorage, normalizeEmail, normalizePhone, formatForDisplay } from '@/utils/textNormalization';
import { checkVoterDuplicate, getFieldDisplayName } from '@/utils/voterValidation';

type Eleitor = Database['public']['Tables']['eleitores']['Row'];
type EleitorInsert = Database['public']['Tables']['eleitores']['Insert'];
type EleitorUpdate = Database['public']['Tables']['eleitores']['Update'];

export const useRealEleitores = () => {
  const { user } = useAuthContext();
  const { activeInstitution } = useActiveInstitution();
  const [eleitores, setEleitores] = useState<Eleitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && activeInstitution?.cabinet_id) {
      console.log('Fetching eleitores for cabinet:', activeInstitution.cabinet_id);
      fetchEleitores();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('eleitores-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'eleitores',
            filter: `gabinete_id=eq.${activeInstitution.cabinet_id}`
          },
          (payload) => {
            console.log('Realtime update received:', payload);
            fetchEleitores(); // Refetch data on any change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      console.log('No user or cabinet found, clearing eleitores');
      setEleitores([]);
      setLoading(false);
    }
  }, [user, activeInstitution?.cabinet_id]);

  const fetchEleitores = async () => {
    if (!user || !activeInstitution?.cabinet_id) {
      console.log('🚫 Cannot fetch eleitores: missing user or cabinet_id', {
        hasUser: !!user,
        userId: user?.id,
        cabinetId: activeInstitution?.cabinet_id,
        activeInstitution
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching eleitores for cabinet_id:', activeInstitution.cabinet_id);
      console.log('🔍 Current user ID:', user.id);
      console.log('🔍 User email:', user.email);

      const { data, error: fetchError } = await supabase
        .from('eleitores')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('created_at', { ascending: false });

      console.log('📊 Eleitores query result:', { 
        data: data?.length, 
        error: fetchError,
        hasData: !!data,
        errorDetails: fetchError ? JSON.stringify(fetchError) : null,
        sql_state: fetchError?.code,
        hint: fetchError?.hint,
        details: fetchError?.details
      });

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('✅ Successfully fetched eleitores:', data?.length || 0);
      setEleitores(data || []);
    } catch (err) {
      console.error('💥 Error fetching eleitores:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch eleitores');
      setEleitores([]);
    } finally {
      setLoading(false);
    }
  };

  const createEleitor = async (eleitorData: Omit<EleitorInsert, 'user_id' | 'gabinete_id'>) => {
    if (!user || !activeInstitution) {
      throw new Error('User or institution not available');
    }

    // Normalize data before validation and saving
    const normalizedData = {
      ...eleitorData,
      name: eleitorData.name.trim(),
      email: eleitorData.email ? normalizeEmail(eleitorData.email) : null,
      whatsapp: normalizePhone(eleitorData.whatsapp),
      neighborhood: eleitorData.neighborhood ? normalizeForStorage(eleitorData.neighborhood) : '',
      profession: eleitorData.profession ? normalizeForStorage(eleitorData.profession) : null,
    };

    // Check for duplicates
    const duplicateCheck = await checkVoterDuplicate(activeInstitution.cabinet_id, {
      email: normalizedData.email || undefined,
      whatsapp: normalizedData.whatsapp,
      birth_date: normalizedData.birth_date || undefined,
    });

    if (duplicateCheck.isDuplicate) {
      const fieldName = getFieldDisplayName(duplicateCheck.duplicateField!);
      throw new Error(`Eleitor já cadastrado neste gabinete. Existe outro eleitor com o mesmo ${fieldName}.`);
    }

    const { data, error: createError } = await supabase
      .from('eleitores')
      .insert({
        ...normalizedData,
        user_id: user.id,
        gabinete_id: activeInstitution.cabinet_id
      })
      .select()
      .single();

    if (createError) throw createError;

    setEleitores(prev => [data, ...prev]);
    return data;
  };

  const updateEleitor = async (id: string, updates: EleitorUpdate) => {
    console.log('🔄 updateEleitor called with:', { id, updates });
    
    if (!activeInstitution) {
      console.error('❌ No active institution');
      throw new Error('Institution not available');
    }

    console.log('✅ Active institution:', activeInstitution);

    // First, get the current eleitor data
    const currentEleitor = eleitores.find(e => e.id === id);
    if (!currentEleitor) {
      console.error('❌ Eleitor not found in local state');
      throw new Error('Eleitor não encontrado');
    }

    console.log('✅ Current eleitor:', currentEleitor);

    // Normalize data before validation and saving
    const normalizedUpdates = { ...updates };
    
    if (updates.name !== undefined) {
      normalizedUpdates.name = updates.name.trim();
    }
    
    if (updates.email !== undefined) {
      normalizedUpdates.email = updates.email ? normalizeEmail(updates.email) : null;
    }
    
    if (updates.whatsapp !== undefined) {
      normalizedUpdates.whatsapp = normalizePhone(updates.whatsapp);
    }
    
    if (updates.neighborhood !== undefined) {
      normalizedUpdates.neighborhood = updates.neighborhood ? normalizeForStorage(updates.neighborhood) : '';
    }
    
    if (updates.profession !== undefined) {
      normalizedUpdates.profession = updates.profession ? normalizeForStorage(updates.profession) : null;
    }

    console.log('🔄 Normalized updates:', normalizedUpdates);

    // Check for duplicates ONLY for fields that actually changed
    const fieldsToCheck: any = {};
    
    if (updates.email !== undefined && normalizedUpdates.email) {
      const currentEmail = currentEleitor.email ? normalizeEmail(currentEleitor.email) : null;
      if (normalizedUpdates.email !== currentEmail) {
        fieldsToCheck.email = normalizedUpdates.email;
      }
    }
    
    if (updates.whatsapp !== undefined && normalizedUpdates.whatsapp) {
      const currentWhatsapp = normalizePhone(currentEleitor.whatsapp);
      if (normalizedUpdates.whatsapp !== currentWhatsapp) {
        fieldsToCheck.whatsapp = normalizedUpdates.whatsapp;
      }
    }
    
    if (updates.birth_date !== undefined && normalizedUpdates.birth_date) {
      if (normalizedUpdates.birth_date !== currentEleitor.birth_date) {
        fieldsToCheck.birth_date = normalizedUpdates.birth_date;
      }
    }
    
    // Only run duplicate check if we have fields that actually changed
    if (Object.keys(fieldsToCheck).length > 0) {
      console.log('🔍 Checking for duplicates in changed fields:', { fieldsToCheck, excludeId: id });
      
      try {
        const duplicateCheck = await checkVoterDuplicate(activeInstitution.cabinet_id, {
          ...fieldsToCheck,
          excludeId: id,
        });

        if (duplicateCheck.isDuplicate) {
          console.error('❌ Duplicate found:', duplicateCheck);
          const fieldName = getFieldDisplayName(duplicateCheck.duplicateField!);
          throw new Error(`Eleitor já cadastrado neste gabinete. Existe outro eleitor com o mesmo ${fieldName}.`);
        }
        
        console.log('✅ No duplicates found');
      } catch (error) {
        console.error('❌ Error checking duplicates:', error);
        throw error;
      }
    } else {
      console.log('ℹ️ No duplicate-sensitive fields were changed, skipping duplicate check');
    }

    console.log('🔄 Attempting database update with:', { id, normalizedUpdates });

    try {
      const { data, error: updateError } = await supabase
        .from('eleitores')
        .update(normalizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Supabase update error:', {
          error: updateError,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        });
        throw updateError;
      }

      console.log('✅ Database update successful:', data);

      setEleitores(prev => prev.map(eleitor => 
        eleitor.id === id ? data : eleitor
      ));
      
      return data;
    } catch (error: any) {
      console.error('❌ Update failed:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack,
      });
      throw error;
    }
  };

  const deleteEleitor = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('eleitores')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    setEleitores(prev => prev.filter(eleitor => eleitor.id !== id));
  };

  return {
    eleitores,
    loading,
    error,
    fetchEleitores,
    createEleitor,
    updateEleitor,
    deleteEleitor
  };
};