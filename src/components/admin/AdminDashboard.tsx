import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  Calculator, 
  TrendingUp, 
  Warehouse,
  AlertTriangle,
  Calendar,
  DollarSign
} from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

const COLORS = ['#8B4513', '#D2691E', '#CD853F', '#DEB887'];

export const AdminDashboard = () => {
  const { stats, loading, selectedYear, filterByMonth } = useAdminDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return monthNames[parseInt(month) - 1];
  };

  const chartData = stats.monthlyRevenue.map(data => ({
    ...data,
    monthLabel: formatMonth(data.month)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-luxury font-semibold">Dashboard</h2>
          <p className="text-muted-foreground">Visão geral do seu e-commerce</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(year) => filterByMonth(new Date().getMonth() + 1, parseInt(year))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2023, 2022].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-effect shadow-elegant hover:shadow-luxury transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produtos</p>
                <p className="text-3xl font-luxury font-bold text-accent">{stats.totalProducts}</p>
                <p className="text-xs text-muted-foreground">Total cadastrados</p>
              </div>
              <Package className="h-8 w-8 text-accent/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect shadow-elegant hover:shadow-luxury transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos</p>
                <p className="text-3xl font-luxury font-bold text-blue-600">{stats.totalOrders}</p>
                <p className="text-xs text-muted-foreground">Total realizados</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-600/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect shadow-elegant hover:shadow-luxury transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Estoque</p>
                <p className="text-2xl font-luxury font-bold text-green-600">
                  {formatCurrency(stats.totalInventoryValue)}
                </p>
                <p className="text-xs text-muted-foreground">{stats.totalStockItems} itens</p>
              </div>
              <Warehouse className="h-8 w-8 text-green-600/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect shadow-elegant hover:shadow-luxury transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ganho Potencial</p>
                <p className="text-2xl font-luxury font-bold text-purple-600">
                  {formatCurrency(stats.totalPotentialProfit)}
                </p>
                <p className="text-xs text-muted-foreground">Se vender tudo</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="glass-effect shadow-elegant">
          <CardHeader>
            <CardTitle className="font-luxury flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Receita Mensal {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === 'grossRevenue' ? 'Receita Bruta' : 
                    name === 'netRevenue' ? 'Receita Líquida' : 'Lucro'
                  ]}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="grossRevenue" 
                  stroke="#8B4513" 
                  strokeWidth={3}
                  name="Receita Bruta"
                />
                <Line 
                  type="monotone" 
                  dataKey="netRevenue" 
                  stroke="#D2691E" 
                  strokeWidth={2}
                  name="Receita Líquida"
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#22C55E" 
                  strokeWidth={2}
                  name="Lucro"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Chart */}
        <Card className="glass-effect shadow-elegant">
          <CardHeader>
            <CardTitle className="font-luxury flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
              Vendas por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'orders' ? `${value} pedidos` : formatCurrency(value), 
                    name === 'orders' ? 'Pedidos' : 'Receita'
                  ]}
                />
                <Bar dataKey="orders" fill="#8B4513" name="Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Products Alert */}
      {stats.expiringProducts.length > 0 && (
        <Card className="glass-effect shadow-elegant border-orange-200">
          <CardHeader>
            <CardTitle className="font-luxury flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Produtos Vencendo nos Próximos 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.expiringProducts.slice(0, 6).map((product) => (
                <div key={product.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {product.stock_quantity} un.
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>Vence: {new Date(product.expiry_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
            {stats.expiringProducts.length > 6 && (
              <p className="text-sm text-muted-foreground mt-4">
                E mais {stats.expiringProducts.length - 6} produtos...
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};