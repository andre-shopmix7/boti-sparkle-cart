import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Favorite {
  id: string;
  product_id: string;
  user_id?: string;
  session_id?: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate or get session ID for guests
  const getSessionId = () => {
    let sessionId = localStorage.getItem("guest_session_id");
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("guest_session_id", sessionId);
    }
    return sessionId;
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from("favorites").select("*");

      if (user) {
        query = query.eq("user_id", user.id);
      } else {
        const sessionId = getSessionId();
        query = query.eq("session_id", sessionId).is("user_id", null);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching favorites:", error);
        return;
      }

      setFavorites(data || []);
    } catch (error) {
      console.error("Error in fetchFavorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (productId: string) => {
    try {
      // Check if already favorited
      const existingFavorite = favorites.find(fav => fav.product_id === productId);

      if (existingFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("id", existingFavorite.id);

        if (error) throw error;

        // Update local state
        setFavorites(favorites.filter(fav => fav.id !== existingFavorite.id));
        
        toast.success("Removido dos favoritos");
      } else {
        // Add to favorites
        const favoriteData: any = {
          product_id: productId,
        };

        if (user) {
          favoriteData.user_id = user.id;
        } else {
          favoriteData.session_id = getSessionId();
        }

        const { data, error } = await supabase
          .from("favorites")
          .insert(favoriteData)
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setFavorites([...favorites, data]);
        
        toast.success("Adicionado aos favoritos");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Erro ao atualizar favoritos");
    }
  };

  // Helper function to check if a product is favorited
  const isFavorite = (productId: string) => {
    return favorites.some(fav => fav.product_id === productId);
  };

  // Get favorite product IDs (for backward compatibility)
  const getFavoriteIds = () => {
    return favorites.map(fav => fav.product_id);
  };

  // Migrate guest favorites to user account when user logs in
  const migrateFavoritesToUser = async (userId: string) => {
    try {
      const sessionId = localStorage.getItem("guest_session_id");
      if (!sessionId) return;

      // Update guest favorites to be associated with the user
      const { error } = await supabase
        .from("favorites")
        .update({ user_id: userId, session_id: null })
        .eq("session_id", sessionId)
        .is("user_id", null);

      if (error) {
        console.error("Error migrating favorites:", error);
      } else {
        // Clear guest session since favorites are now associated with user
        localStorage.removeItem("guest_session_id");
      }
    } catch (error) {
      console.error("Error in migrateFavoritesToUser:", error);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  // Migrate favorites when user logs in
  useEffect(() => {
    if (user) {
      migrateFavoritesToUser(user.id);
    }
  }, [user]);

  return {
    favorites,
    favoriteIds: getFavoriteIds(), // For backward compatibility
    loading,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
};