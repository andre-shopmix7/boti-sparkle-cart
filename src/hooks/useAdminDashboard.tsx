import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalInventoryValue: number;
  totalPotentialProfit: number;
  totalStockItems: number;
  expiringProducts: Product[];
  monthlyRevenue: MonthlyRevenue[];
  salesByMonth: SalesData[];
}

interface Product {
  id: string;
  name: string;
  brand: string;
  expiry_date: string;
  stock_quantity: number;
  cost_price?: number;
}

interface MonthlyRevenue {
  month: string;
  grossRevenue: number;
  netRevenue: number;
  profit: number;
}

interface SalesData {
  month: string;
  orders: number;
  revenue: number;
}

export const useAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalInventoryValue: 0,
    totalPotentialProfit: 0,
    totalStockItems: 0,
    expiringProducts: [],
    monthlyRevenue: [],
    salesByMonth: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch basic counts and admin dashboard data
      const [ordersRes, usersRes, dashboardData] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.rpc('get_admin_dashboard_data'),
      ]);

      const adminData = dashboardData.data?.[0];
      const inventoryValue = Number(adminData?.total_inventory_value || 0);
      const potentialProfit = Number(adminData?.total_potential_profit || 0);
      const totalStock = Number(adminData?.total_stock_items || 0);
      const expiringProducts = Array.isArray(adminData?.expiring_products) 
        ? adminData.expiring_products.map((p: any) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            expiry_date: p.expiry_date,
            stock_quantity: p.stock_quantity
          }))
        : [];

      // Fetch monthly sales data
      const { data: monthlyOrders } = await supabase
        .from('orders')
        .select('created_at, total_amount, payment_status')
        .eq('payment_status', 'completed')
        .gte('created_at', `${selectedYear}-01-01`)
        .lt('created_at', `${selectedYear + 1}-01-01`);

      // Process monthly data
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = (i + 1).toString().padStart(2, '0');
        const monthOrders = monthlyOrders?.filter(order => 
          new Date(order.created_at).getMonth() === i
        ) || [];

        const revenue = monthOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        
        return {
          month: `${selectedYear}-${month}`,
          orders: monthOrders.length,
          revenue,
          grossRevenue: revenue,
          netRevenue: revenue * 0.85, // Assuming 15% costs
          profit: revenue * 0.3, // Assuming 30% profit margin
        };
      });

      setStats({
        totalProducts: Number(adminData?.product_count || 0),
        totalOrders: ordersRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalInventoryValue: inventoryValue,
        totalPotentialProfit: potentialProfit,
        totalStockItems: totalStock,
        expiringProducts: expiringProducts,
        monthlyRevenue: monthlyData,
        salesByMonth: monthlyData,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const filterByMonth = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  return {
    stats,
    loading,
    selectedMonth,
    selectedYear,
    filterByMonth,
    refetch: fetchDashboardData,
  };
};