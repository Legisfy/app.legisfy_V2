import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import { useActiveInstitution } from './useActiveInstitution';

interface ModulePermission {
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}

interface UserPermissions {
  agenda: ModulePermission;
  eleitores: ModulePermission;
  demandas: ModulePermission;
  projetos_lei: ModulePermission;
  indicacoes: ModulePermission;
  publicos: ModulePermission;
}

const ALL_ACCESS: ModulePermission = { can_read: true, can_write: true, can_delete: true };
const READ_ONLY: ModulePermission = { can_read: true, can_write: false, can_delete: false };
const NO_ACCESS: ModulePermission = { can_read: false, can_write: false, can_delete: false };

const FULL_PERMISSIONS: UserPermissions = {
  agenda: ALL_ACCESS,
  eleitores: ALL_ACCESS,
  demandas: ALL_ACCESS,
  projetos_lei: ALL_ACCESS,
  indicacoes: ALL_ACCESS,
  publicos: ALL_ACCESS,
};

const DEFAULT_PERMISSIONS: UserPermissions = {
  agenda: READ_ONLY,
  eleitores: READ_ONLY,
  demandas: READ_ONLY,
  projetos_lei: READ_ONLY,
  indicacoes: READ_ONLY,
  publicos: READ_ONLY,
};

export const usePermissions = () => {
  const { user } = useAuthContext();
  const { activeInstitution } = useActiveInstitution();
  const [permissions, setPermissions] = useState<UserPermissions>(FULL_PERMISSIONS);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (user && activeInstitution?.cabinet_id) {
      fetchUserPermissions();
    } else {
      setLoading(false);
    }
  }, [user, activeInstitution?.cabinet_id]);

  const fetchUserPermissions = async () => {
    if (!user || !activeInstitution?.cabinet_id) return;

    try {
      setLoading(true);

      // Check user role in the gabinete
      const { data: gabUsuario } = await (supabase as any)
        .from('gabinete_usuarios')
        .select('role')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .eq('user_id', user.id)
        .eq('ativo', true)
        .single();

      const role = gabUsuario?.role || null;
      setUserRole(role);

      // Check if user is the politician (owner) - they have all permissions
      const { data: gabineteData } = await supabase
        .from('gabinetes')
        .select('politico_id')
        .eq('id', activeInstitution.cabinet_id)
        .single();

      if (gabineteData?.politico_id === user.id || role === 'politico' || role === 'chefe_gabinete') {
        // Politician and chefe_gabinete have all permissions
        setPermissions(FULL_PERMISSIONS);
        setLoading(false);
        return;
      }

      // For assessors: fetch from assessor_permissions table
      const { data: permissionsData, error } = await (supabase as any)
        .from('assessor_permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('cabinet_id', activeInstitution.cabinet_id);

      if (error) {
        console.error('Error fetching permissions:', error);
        setPermissions(DEFAULT_PERMISSIONS);
        setLoading(false);
        return;
      }

      // Build permissions object from database data
      const newPermissions: UserPermissions = { ...DEFAULT_PERMISSIONS };

      const moduleKeys: (keyof UserPermissions)[] = ['agenda', 'eleitores', 'demandas', 'projetos_lei', 'indicacoes', 'publicos'];

      (permissionsData || []).forEach((perm: any) => {
        const key = perm.permission_module as keyof UserPermissions;
        if (moduleKeys.includes(key)) {
          newPermissions[key] = {
            can_read: perm.can_read ?? false,
            can_write: perm.can_write ?? false,
            can_delete: perm.can_delete ?? false,
          };
        }
      });

      setPermissions(newPermissions);
    } catch (error) {
      console.error('Error in fetchUserPermissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (module: keyof UserPermissions, action: 'read' | 'write' | 'delete'): boolean => {
    const modulePermissions = permissions[module];
    if (!modulePermissions) return false;

    switch (action) {
      case 'read':
        return modulePermissions.can_read;
      case 'write':
        return modulePermissions.can_write;
      case 'delete':
        return modulePermissions.can_delete;
      default:
        return false;
    }
  };

  return {
    permissions,
    loading,
    hasPermission,
    userRole,
    refetch: fetchUserPermissions
  };
};