import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveInstitution } from './useActiveInstitution';

interface IndicationTag {
  id: string;
  tag_type: string;
  name: string;
  category: string;
  color: string;
  icon: string;
  created_at?: string;
}

export const useIndicationCategories = () => {
  const [tags, setTags] = useState<IndicationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeInstitution } = useActiveInstitution();

  useEffect(() => {
    fetchTags();

    // Set up real-time subscription for tags
    const channel = supabase
      .channel('indication-tags-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'indication_tags'
        },
        () => {
          fetchTags();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeInstitution?.cabinet_id]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching indication tags...');
      
      // Fetch default indication tags
      const { data: defaultTags, error: defaultError } = await supabase
        .from('indication_tags')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (defaultError) throw defaultError;

      let combinedTags: IndicationTag[] = (defaultTags || []).map(tag => ({
        ...tag,
        created_at: tag.created_at || new Date().toISOString()
      }));

      // Fetch custom tags for this gabinete if available
      if (activeInstitution?.cabinet_id) {
        const { data: customTags, error: customError } = await supabase
          .from('gabinete_custom_tags')
          .select('id, name, category, subcategory, color, icon')
          .eq('gabinete_id', activeInstitution.cabinet_id)
          .eq('category', 'indicacoes');

        if (!customError && customTags) {
          // Transform custom tags to match IndicationTag interface
          const transformedCustomTags: IndicationTag[] = customTags.map(tag => ({
            id: tag.id,
            tag_type: tag.name.toLowerCase().replace(/\s+/g, '_'),
            name: tag.name,
            category: tag.subcategory || 'Personalizado',
            color: tag.color,
            icon: tag.icon,
            created_at: new Date().toISOString()
          }));

          combinedTags = [...combinedTags, ...transformedCustomTags];
        }
      }

      console.log('📊 Combined indication tags result:', {
        defaultCount: defaultTags?.length,
        combinedCount: combinedTags.length
      });

      setTags(combinedTags);
    } catch (error) {
      console.error('❌ Error fetching indication tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTagsByCategory = (category: string) => {
    return tags.filter(tag => tag.category === category);
  };

  const getCategories = () => {
    const categories = Array.from(new Set(tags.map(tag => tag.category)));
    return categories;
  };

  return {
    tags,
    loading,
    getTagsByCategory,
    getCategories,
    fetchTags
  };
};
