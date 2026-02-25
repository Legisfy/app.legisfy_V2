import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveInstitution } from './useActiveInstitution';

interface DemandCategory {
  id: string;
  name: string;
  icon: string;
}

interface DemandTag {
  id: string;
  name: string;
  category_id: string;
  color?: string;
  is_custom?: boolean;
  created_at?: string;
}

export const useDemandCategories = () => {
  const { activeInstitution } = useActiveInstitution();
  const [categories, setCategories] = useState<DemandCategory[]>([]);
  const [tags, setTags] = useState<DemandTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    // Set up real-time subscription for categories and tags
    const channel = supabase
      .channel('demand-categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demand_categories'
        },
        () => {
          fetchData(); // Refresh data when categories change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demand_tags'
        },
        () => {
          fetchData(); // Refresh data when tags change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gabinete_custom_tags'
        },
        () => {
          fetchData(); // Refresh data when custom tags change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeInstitution?.cabinet_id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [categoriesResult, tagsResult] = await Promise.all([
        supabase.from('demand_categories').select('*').order('name'),
        supabase.from('demand_tags').select('*').order('name')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (tagsResult.error) throw tagsResult.error;

      let allTags: DemandTag[] = (tagsResult.data || []).map(tag => ({
        ...tag,
        created_at: tag.created_at || undefined
      }));

      // Fetch custom tags for this gabinete if available
      if (activeInstitution?.cabinet_id) {
        const { data: customTags, error: customError } = await supabase
          .from('gabinete_custom_tags')
          .select('id, name, category, color')
          .eq('gabinete_id', activeInstitution.cabinet_id)
          .eq('category', 'demandas')
          .order('name');

        if (!customError && customTags) {
          // Transform custom tags to match DemandTag interface
          const transformedCustomTags: DemandTag[] = customTags.map(tag => ({
            id: tag.id,
            name: tag.name,
            category_id: 'custom',
            color: tag.color,
            is_custom: true,
            created_at: undefined
          }));

          allTags = [...allTags, ...transformedCustomTags];
        }
      }

      setCategories(categoriesResult.data || []);
      setTags(allTags);
    } catch (error) {
      console.error('Error fetching demand categories and tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTagsByCategory = (categoryId: string) => {
    return tags.filter(tag => tag.category_id === categoryId);
  };

  return {
    categories,
    tags,
    loading,
    getTagsByCategory,
    fetchData
  };
};