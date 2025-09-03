import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminOrder {
  id: string;
  user_id?: string;
  guest_email?: string;
  guest_name?: string;
  guest_phone?: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  payment_method?: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
  session_id?: string;
  stripe_session_id?: string;
  pix_qr_code?: string;
  notes?: string;
  order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product: {
      id: string;
      name: string;
      brand?: string;
      cost_price?: number;
      profit_percentage?: number;
      profit_amount?: number;
    };
  }>;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalProfit: number;
}

export const useAdminOrders = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            product:products (
              id,
              name,
              brand,
              cost_price,
              profit_percentage,
              profit_amount
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedOrders: AdminOrder[] = ordersData?.map(order => ({
        ...order,
        order_items: order.order_items || []
      })) || [];

      setOrders(formattedOrders);

      // Calculate stats
      const totalOrders = formattedOrders.length;
      const pendingOrders = formattedOrders.filter(o => o.order_status === 'processing').length;
      const completedOrders = formattedOrders.filter(o => o.order_status === 'completed').length;
      const totalRevenue = formattedOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
      
      // Calculate total profit from order items
      let totalProfit = 0;
      formattedOrders.forEach(order => {
        order.order_items.forEach(item => {
          if (item.product?.profit_amount) {
            totalProfit += Number(item.product.profit_amount) * item.quantity;
          } else if (item.product?.cost_price) {
            const profit = (item.unit_price - Number(item.product.cost_price)) * item.quantity;
            totalProfit += Math.max(0, profit);
          }
        });
      });

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        totalProfit,
      });

    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Status do pedido atualizado");
      fetchOrders();
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error("Erro ao atualizar status do pedido");
    }
  };

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          payment_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Status de pagamento atualizado");
      fetchOrders();
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      toast.error("Erro ao atualizar status de pagamento");
    }
  };

  const updateOrderNotes = async (orderId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Observações atualizadas");
      fetchOrders();
    } catch (error: any) {
      console.error("Error updating order notes:", error);
      toast.error("Erro ao atualizar observações");
    }
  };

  const getOrderById = async (orderId: string): Promise<AdminOrder | null> => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            product:products (
              id,
              name,
              brand,
              cost_price,
              profit_percentage,
              profit_amount
            )
          )
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;

      return {
        ...data,
        order_items: data.order_items || []
      };
    } catch (error: any) {
      console.error("Error fetching order:", error);
      toast.error("Erro ao carregar detalhes do pedido");
      return null;
    }
  };

  const calculateOrderProfit = (order: AdminOrder): number => {
    let totalProfit = 0;
    order.order_items.forEach(item => {
      if (item.product?.profit_amount) {
        totalProfit += Number(item.product.profit_amount) * item.quantity;
      } else if (item.product?.cost_price) {
        const profit = (item.unit_price - Number(item.product.cost_price)) * item.quantity;
        totalProfit += Math.max(0, profit);
      }
    });
    return totalProfit;
  };

  const calculateOrderProfitPercentage = (order: AdminOrder): number => {
    const profit = calculateOrderProfit(order);
    const revenue = Number(order.total_amount);
    return revenue > 0 ? (profit / revenue) * 100 : 0;
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    stats,
    loading,
    selectedOrder,
    setSelectedOrder,
    fetchOrders,
    updateOrderStatus,
    updatePaymentStatus,
    updateOrderNotes,
    getOrderById,
    calculateOrderProfit,
    calculateOrderProfitPercentage,
  };
};