import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Plus, 
  Settings, 
  BarChart3, 
  Users, 
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  QrCode
} from "lucide-react";
import { ProductForm } from "./ProductForm";
import { ProductList } from "./ProductList";
import { AdminDashboard } from "./AdminDashboard";
import { OrdersManagement } from "./OrdersManagement";
import { BannerManagement } from "./BannerManagement";
import { UserRoleManager } from "./UserRoleManager";
import { PixQRCodeGenerator } from "./PixQRCodeGenerator";

interface AdminLayoutProps {
  onBack: () => void;
}

type AdminView = 'dashboard' | 'products' | 'add-product' | 'edit-product' | 'orders' | 'users' | 'settings' | 'user-roles' | 'pix-qr';

export const AdminLayout = ({ onBack }: AdminLayoutProps) => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'add-product', label: 'Novo Produto', icon: Plus },
    { id: 'pix-qr', label: 'QR Code PIX', icon: QrCode },
    { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
    { id: 'user-roles', label: 'Permissões', icon: Users },
    { id: 'settings', label: 'Banners', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-border/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent" />
                <h1 className="text-xl font-luxury font-semibold">Painel Administrativo</h1>
              </div>
            </div>
            <Badge variant="secondary" className="bg-accent/10 text-accent font-medium">
              Admin: {user?.email}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="glass-effect shadow-elegant">
              <CardHeader>
                <CardTitle className="font-luxury text-lg">Menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={currentView === item.id ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        currentView === item.id 
                          ? "bg-gradient-luxury text-white shadow-glow" 
                          : "hover:bg-accent/10"
                      }`}
                      onClick={() => setCurrentView(item.id as AdminView)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="animate-luxury-fade">
              {currentView === 'dashboard' && <AdminDashboard />}
              {currentView === 'products' && (
                <ProductList 
                  onEditProduct={(product) => {
                    setEditingProduct(product);
                    setCurrentView('edit-product');
                  }}
                />
              )}
              {currentView === 'add-product' && <ProductForm />}
              {currentView === 'edit-product' && (
                <ProductForm 
                  editingProduct={editingProduct}
                  onBack={() => {
                    setCurrentView('products');
                    setEditingProduct(null);
                  }}
                />
              )}
              {currentView === 'pix-qr' && <PixQRCodeGenerator />}
              {currentView === 'orders' && <OrdersManagement />}
              {currentView === 'user-roles' && <UserRoleManager />}
              {currentView === 'settings' && <BannerManagement />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrdersPanel = () => (
  <Card className="glass-effect shadow-elegant">
    <CardHeader>
      <CardTitle className="font-luxury">Gerenciar Pedidos</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Funcionalidade em desenvolvimento...</p>
    </CardContent>
  </Card>
);