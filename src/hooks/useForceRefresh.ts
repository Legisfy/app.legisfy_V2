import { useState, useCallback } from 'react';

export const useForceRefresh = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const forceRefresh = useCallback(() => {
    // Clear any localStorage cache
    localStorage.removeItem('active_cabinet_id');
    
    // Force component re-render
    setRefreshKey(prev => prev + 1);
    
    // Force page reload after short delay to ensure fresh data
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, []);

  return { refreshKey, forceRefresh };
};