import { supabase } from '@/integrations/supabase/client';
import { normalizeEmail, normalizePhone } from './textNormalization';

export interface VoterDuplicateCheck {
  email?: string;
  whatsapp?: string;
  birth_date?: string;
  excludeId?: string; // For updates, exclude the current record
}

export interface DuplicateResult {
  isDuplicate: boolean;
  duplicateField?: 'email' | 'whatsapp' | 'birth_date';
  existingVoter?: {
    id: string;
    name: string;
    email?: string;
    whatsapp: string;
    birth_date?: string;
  };
}

/**
 * Check for duplicate voters within the same gabinete
 */
export const checkVoterDuplicate = async (
  gabineteId: string,
  voterData: VoterDuplicateCheck
): Promise<DuplicateResult> => {
  try {
    const { email, whatsapp, birth_date, excludeId } = voterData;
    
    console.log('🔍 checkVoterDuplicate called:', { gabineteId, email, whatsapp, birth_date, excludeId });
    
    // Build the query conditions
    const conditions = [];
    
    if (email) {
      const normalizedEmail = normalizeEmail(email);
      conditions.push(`email.eq."${normalizedEmail}"`);
    }
    
    if (whatsapp) {
      const normalizedPhone = normalizePhone(whatsapp);
      conditions.push(`whatsapp.eq."${normalizedPhone}"`);
    }
    
    if (birth_date) {
      conditions.push(`birth_date.eq."${birth_date}"`);
    }
    
    console.log('📋 Conditions to check:', conditions);
    
    if (conditions.length === 0) {
      console.log('✅ No conditions to check');
      return { isDuplicate: false };
    }
    
    // Check each condition separately to identify which field is duplicate
    for (const condition of conditions) {
      console.log('🔎 Checking condition:', condition);
      
      let query = supabase
        .from('eleitores')
        .select('id, name, email, whatsapp, birth_date')
        .eq('gabinete_id', gabineteId);
      
      // Parse condition to apply the right filter
      if (condition.includes('email.eq.')) {
        const emailValue = condition.match(/email\.eq\."(.+)"/)?.[1];
        if (emailValue) {
          query = query.eq('email', emailValue);
          console.log('  📧 Checking email:', emailValue);
        }
      } else if (condition.includes('whatsapp.eq.')) {
        const phoneValue = condition.match(/whatsapp\.eq\."(.+)"/)?.[1];
        if (phoneValue) {
          query = query.eq('whatsapp', phoneValue);
          console.log('  📱 Checking whatsapp:', phoneValue);
        }
      } else if (condition.includes('birth_date.eq.')) {
        const dateValue = condition.match(/birth_date\.eq\."(.+)"/)?.[1];
        if (dateValue) {
          query = query.eq('birth_date', dateValue);
          console.log('  🎂 Checking birth_date:', dateValue);
        }
      }
      
      // Exclude current record if updating
      if (excludeId) {
        query = query.neq('id', excludeId);
        console.log('  ⚠️ Excluding ID:', excludeId);
      }
      
      const { data, error } = await query.limit(1);
      
      console.log('  📊 Query result:', { data, error, foundRecords: data?.length });
      
      if (error) {
        console.error('❌ Error checking voter duplicate:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const existingVoter = data[0];
        
        console.log('❌ Duplicate found:', existingVoter);
        
        // Determine which field is duplicate
        let duplicateField: 'email' | 'whatsapp' | 'birth_date' = 'email';
        
        if (condition.includes('email.eq.')) {
          duplicateField = 'email';
        } else if (condition.includes('whatsapp.eq.')) {
          duplicateField = 'whatsapp';
        } else if (condition.includes('birth_date.eq.')) {
          duplicateField = 'birth_date';
        }
        
        return {
          isDuplicate: true,
          duplicateField,
          existingVoter: {
            id: existingVoter.id,
            name: existingVoter.name,
            email: existingVoter.email,
            whatsapp: existingVoter.whatsapp,
            birth_date: existingVoter.birth_date,
          },
        };
      }
    }
    
    console.log('✅ No duplicates found for any condition');
    return { isDuplicate: false };
  } catch (error) {
    console.error('💥 Error in checkVoterDuplicate:', error);
    throw error;
  }
};

/**
 * Get field name for display in Portuguese
 */
export const getFieldDisplayName = (field: string): string => {
  const fieldNames: Record<string, string> = {
    email: 'e-mail',
    whatsapp: 'telefone/WhatsApp',
    birth_date: 'data de nascimento',
  };
  
  return fieldNames[field] || field;
};