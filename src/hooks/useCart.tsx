import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  user_id?: string;
  session_id?: string;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    brand: string;
    price: number;
    image_url?: string;
    stock_quantity: number;
  };
}

export const useCart = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
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

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("shopping_cart")
        .select(`
          *,
          products (
            id,
            name,
            brand,
            price,
            stock_quantity
          )
        `);

      if (user) {
        query = query.eq("user_id", user.id);
      } else {
        const sessionId = getSessionId();
        query = query.eq("session_id", sessionId).is("user_id", null);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching cart items:", error);
        return;
      }

      setCartItems(data || []);
    } catch (error) {
      console.error("Error in fetchCartItems:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      // Check if item already exists in cart
      const existingItem = cartItems.find((item) => item.product_id === productId);

      if (existingItem) {
        // Update quantity
        await updateCartItemQuantity(existingItem.id, existingItem.quantity + quantity);
        return;
      }

      // Add new item to cart
      const cartData: any = {
        product_id: productId,
        quantity,
      };

      if (user) {
        cartData.user_id = user.id;
      } else {
        cartData.session_id = getSessionId();
      }

      const { error } = await supabase.from("shopping_cart").insert(cartData);

      if (error) {
        toast.error("Erro ao adicionar ao carrinho");
        console.error("Error adding to cart:", error);
        return;
      }

      await fetchCartItems();
      toast.success("Produto adicionado ao carrinho");
    } catch (error) {
      console.error("Error in addToCart:", error);
      toast.error("Erro inesperado");
    }
  };

  const updateCartItemQuantity = async (cartItemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await removeFromCart(cartItemId);
        return;
      }

      const { error } = await supabase
        .from("shopping_cart")
        .update({ quantity: newQuantity })
        .eq("id", cartItemId);

      if (error) {
        toast.error("Erro ao atualizar quantidade");
        console.error("Error updating cart quantity:", error);
        return;
      }

      await fetchCartItems();
    } catch (error) {
      console.error("Error in updateCartItemQuantity:", error);
      toast.error("Erro inesperado");
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from("shopping_cart")
        .delete()
        .eq("id", cartItemId);

      if (error) {
        toast.error("Erro ao remover do carrinho");
        console.error("Error removing from cart:", error);
        return;
      }

      await fetchCartItems();
      toast.success("Produto removido do carrinho");
    } catch (error) {
      console.error("Error in removeFromCart:", error);
      toast.error("Erro inesperado");
    }
  };

  const clearCart = async () => {
    try {
      let query = supabase.from("shopping_cart").delete();

      if (user) {
        query = query.eq("user_id", user.id);
      } else {
        const sessionId = getSessionId();
        query = query.eq("session_id", sessionId).is("user_id", null);
      }

      const { error } = await query.neq("id", "00000000-0000-0000-0000-000000000000"); // Always true condition

      if (error) {
        toast.error("Erro ao limpar carrinho");
        console.error("Error clearing cart:", error);
        return;
      }

      setCartItems([]);
      toast.success("Carrinho limpo");
    } catch (error) {
      console.error("Error in clearCart:", error);
      toast.error("Erro inesperado");
    }
  };

  // Migrate guest cart to user account when user logs in
  const migrateCartToUser = async (userId: string) => {
    try {
      const sessionId = localStorage.getItem("guest_session_id");
      if (!sessionId) return;

      // Update guest cart items to be associated with the user
      const { error } = await supabase
        .from("shopping_cart")
        .update({ user_id: userId, session_id: null })
        .eq("session_id", sessionId)
        .is("user_id", null);

      if (error) {
        console.error("Error migrating cart:", error);
      }
    } catch (error) {
      console.error("Error in migrateCartToUser:", error);
    }
  };

  // Calculate totals
  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.product?.price || 0;
    return total + (price * item.quantity);
  }, 0);

  const cartItemsCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  useEffect(() => {
    fetchCartItems();
  }, [user]);

  // Migrate cart when user logs in
  useEffect(() => {
    if (user) {
      migrateCartToUser(user.id);
    }
  }, [user]);

  return {
    cartItems,
    loading,
    cartTotal,
    cartItemsCount,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    refetch: fetchCartItems,
  };
};