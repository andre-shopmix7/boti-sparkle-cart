import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
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
      
      let query = supabase.from("favorites").select("product_id");

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

      setFavorites(data?.map((item) => item.product_id) || []);
    } catch (error) {
      console.error("Error in fetchFavorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (productId: string) => {
    try {
      const isFavorite = favorites.includes(productId);

      if (isFavorite) {
        // Remove from favorites
        let query = supabase.from("favorites").delete().eq("product_id", productId);

        if (user) {
          query = query.eq("user_id", user.id);
        } else {
          const sessionId = getSessionId();
          query = query.eq("session_id", sessionId).is("user_id", null);
        }

        const { error } = await query;

        if (error) {
          toast.error("Erro ao remover dos favoritos");
          console.error("Error removing favorite:", error);
          return;
        }

        setFavorites((prev) => prev.filter((id) => id !== productId));
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

        const { error } = await supabase.from("favorites").insert(favoriteData);

        if (error) {
          toast.error("Erro ao adicionar aos favoritos");
          console.error("Error adding favorite:", error);
          return;
        }

        setFavorites((prev) => [...prev, productId]);
      }
    } catch (error) {
      console.error("Error in toggleFavorite:", error);
      toast.error("Erro inesperado");
    }
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
    loading,
    toggleFavorite,
    refetch: fetchFavorites,
  };
};