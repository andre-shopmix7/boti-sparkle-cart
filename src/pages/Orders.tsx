import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/components/auth/AuthPage";
import { Header } from "@/components/layout/Header";
import { OrdersList } from "@/components/orders/OrdersList";
import { useCart } from "@/hooks/useCart";
import { Card, CardContent } from "@/components/ui/card";

const Orders = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { cartItemsCount } = useCart();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="glass-effect shadow-elegant">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground font-elegant">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCartClick = () => {
    // TODO: Implement cart modal/page
    console.log("Cart clicked");
  };

  const handleAuthClick = () => {
    if (user) {
      console.log("User menu clicked");
    } else {
      setShowAuth(true);
    }
  };

  const handleViewOrder = (orderId: string) => {
    // TODO: Navigate to order details page
    console.log("View order:", orderId);
  };

  if (showAuth && !user) {
    return (
      <AuthPage
        onAuthSuccess={() => setShowAuth(false)}
        onBack={() => setShowAuth(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header 
        cartItemsCount={cartItemsCount}
        onCartClick={handleCartClick}
        onAuthClick={handleAuthClick}
      />
      
      <main className="container mx-auto px-4 py-8">
        <OrdersList onViewOrder={handleViewOrder} />
      </main>
    </div>
  );
};

export default Orders;