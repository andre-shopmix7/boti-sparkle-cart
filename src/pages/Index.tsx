import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthPage } from "@/components/auth/AuthPage";
import { Header } from "@/components/layout/Header";
import { PromoBanner } from "@/components/home/PromoBanner";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Heart, Truck } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const { cartItemsCount } = useCart();
  const [showAuth, setShowAuth] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-elegant">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleCartClick = () => {
    // TODO: Implement cart modal/page
    console.log("Cart clicked");
  };

  const handleAuthClick = () => {
    if (user) {
      // User is logged in, show profile menu or logout
      console.log("User menu clicked");
    } else {
      setShowAuth(true);
    }
  };

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
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
        onCategoryFilter={handleCategoryFilter}
      />
      
      <main>
        {/* Promotional Banner */}
        <PromoBanner />

        {/* Featured Products */}
        <FeaturedProducts selectedCategory={selectedCategory} />

        {/* Benefits Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center glass-effect shadow-elegant hover:shadow-luxury transition-all duration-300">
                <CardHeader>
                  <Truck className="h-12 w-12 text-accent mx-auto mb-4" />
                  <CardTitle className="font-luxury text-accent">Frete Grátis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Frete grátis para compras acima de R$ 199,00
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center glass-effect shadow-elegant hover:shadow-luxury transition-all duration-300">
                <CardHeader>
                  <Heart className="h-12 w-12 text-accent mx-auto mb-4" />
                  <CardTitle className="font-luxury text-accent">Qualidade Garantida</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Produtos originais com garantia de qualidade
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center glass-effect shadow-elegant hover:shadow-luxury transition-all duration-300">
                <CardHeader>
                  <Sparkles className="h-12 w-12 text-accent mx-auto mb-4" />
                  <CardTitle className="font-luxury text-accent">Exclusividades</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Lançamentos e produtos exclusivos da marca
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-luxury text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-luxury font-bold mb-4">
              Cadastre-se e receba ofertas exclusivas
            </h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Seja o primeiro a saber sobre lançamentos e promoções especiais
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => setShowAuth(true)}
              className="text-lg px-8 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
            >
              Cadastrar Agora
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-foreground/5 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-accent mb-4">
              <Sparkles className="h-6 w-6" />
              <span className="text-xl font-luxury font-bold">Boticário</span>
            </div>
            <p className="text-muted-foreground">
              © 2024 Loja Virtual Boticário. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
