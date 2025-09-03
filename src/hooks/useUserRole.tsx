import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'customer' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          // If no role exists, default to customer
          if (error.code === 'PGRST116') {
            setRole('customer');
          } else {
            console.error('Error fetching user role:', error);
            setRole('customer'); // Default to customer on error
          }
        } else {
          setRole(data.role as UserRole);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setRole('customer'); // Default to customer on error
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isCustomer = role === 'customer';

  return {
    role,
    isAdmin,
    isCustomer,
    loading
  };
};