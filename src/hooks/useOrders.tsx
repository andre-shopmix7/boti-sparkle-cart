import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface Order {
  id: string;
  user_id?: string;
  session_id?: string;
  guest_email?: string;
  guest_name?: string;
  guest_phone?: string;
  total_amount: number;
  payment_method?: string;
  payment_status: string;
  order_status: string;
  shipping_address: string;
  stripe_session_id?: string;
  pix_qr_code?: string;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

interface CreateOrderData {
  guest_email?: string;
  guest_name?: string;
  guest_phone?: string;
  total_amount: number;
  payment_method?: string;
  shipping_address: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
}

export const useOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const getSessionId = () => {
    let sessionId = localStorage.getItem("guest_session_id");
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("guest_session_id", sessionId);
    }
    return sessionId;
  };

  const setSessionContext = async (sessionId: string) => {
    try {
      await supabase.rpc('set_session_context', { session_id: sessionId });
    } catch (error) {
      console.error('Error setting session context:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      if (user) {
        // Fetch orders for authenticated user
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            order_items (
              id,
              product_id,
              quantity,
              unit_price,
              total_price,
              products (
                name,
                brand
              )
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } else {
        // Fetch orders for guest using session_id
        const sessionId = getSessionId();
        await setSessionContext(sessionId);
        
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            order_items (
              id,
              product_id,
              quantity,
              unit_price,
              total_price,
              products (
                name,
                brand
              )
            )
          `)
          .eq("session_id", sessionId)
          .is("user_id", null)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: CreateOrderData): Promise<string | null> => {
    try {
      const orderPayload: any = {
        total_amount: orderData.total_amount,
        payment_method: orderData.payment_method,
        payment_status: "pending",
        order_status: "processing",
        shipping_address: orderData.shipping_address,
      };

      if (user) {
        orderPayload.user_id = user.id;
      } else {
        // For guests, include guest information and session_id
        orderPayload.guest_email = orderData.guest_email;
        orderPayload.guest_name = orderData.guest_name;
        orderPayload.guest_phone = orderData.guest_phone;
        orderPayload.session_id = getSessionId();
        
        // Set session context for guest
        await setSessionContext(orderPayload.session_id);
      }

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Sucesso!",
        description: "Pedido criado com sucesso.",
      });

      // Refresh orders
      await fetchOrders();
      
      return order.id;
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar pedido. Tente novamente.",
        variant: "destructive",
      });
      return null;
    }
  };

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      if (!user) {
        // For guests, set session context
        const sessionId = getSessionId();
        await setSessionContext(sessionId);
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            products (
              name,
              brand,
              price
            )
          )
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching order:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes do pedido.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Migrate guest orders to user when they log in
  const migrateGuestOrders = async (userId: string) => {
    try {
      const sessionId = localStorage.getItem("guest_session_id");
      if (!sessionId) return;

      const { error } = await supabase
        .from("orders")
        .update({ user_id: userId, session_id: null })
        .eq("session_id", sessionId)
        .is("user_id", null);

      if (error) throw error;

      // Clear guest session since orders are now associated with user
      localStorage.removeItem("guest_session_id");
    } catch (error) {
      console.error("Error migrating guest orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Migrate guest orders when user logs in
  useEffect(() => {
    if (user) {
      migrateGuestOrders(user.id);
    }
  }, [user]);

  return {
    orders,
    loading,
    fetchOrders,
    createOrder,
    getOrderById,
  };
};