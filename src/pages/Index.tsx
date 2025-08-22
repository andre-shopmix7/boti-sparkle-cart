import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthPage } from "@/components/auth/AuthPage";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Heart, Gift, Truck } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const { cartItemsCount } = useCart();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
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

  if (showAuth && !user) {
    return (
      <AuthPage
        onAuthSuccess={() => setShowAuth(false)}
        onBack={() => setShowAuth(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartItemsCount={cartItemsCount}
        onCartClick={handleCartClick}
        onAuthClick={handleAuthClick}
      />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-primary/10 via-accent/20 to-primary/5 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
              Descubra sua beleza natural
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Produtos de beleza exclusivos Boticário. Fragrâncias marcantes, 
              cosméticos de qualidade e cuidados especiais para você.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products">
                <Button size="lg" className="text-lg px-8">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Ver Produtos
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Gift className="mr-2 h-5 w-5" />
                Promoções
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Truck className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-primary">Frete Grátis</CardTitle>
                  <CardDescription>
                    Frete grátis para compras acima de R$ 199,00
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-primary">Qualidade Garantida</CardTitle>
                  <CardDescription>
                    Produtos originais com garantia de qualidade Boticário
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-primary">Exclusividades</CardTitle>
                  <CardDescription>
                    Lançamentos e produtos exclusivos da marca
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 bg-accent/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-primary mb-12">
              Categorias em Destaque
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Perfumaria", description: "Fragrâncias exclusivas", badge: "Novo" },
                { name: "Maquiagem", description: "Realce sua beleza", badge: "Mais vendidos" },
                { name: "Cabelos", description: "Cuidados completos", badge: "" },
                { name: "Corpo & Banho", description: "Hidratação intensa", badge: "Promoção" },
                { name: "Rosto", description: "Tratamentos faciais", badge: "" },
                { name: "Presentes", description: "Kits especiais", badge: "Exclusivo" }
              ].map((category, index) => (
                <Card key={index} className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-primary group-hover:text-primary-foreground">
                          {category.name}
                        </h3>
                        <p className="text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                      {category.badge && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {category.badge}
                        </Badge>
                      )}
                    </div>
                    <Link to="/products">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start p-0 h-auto font-medium text-primary hover:text-primary-foreground group-hover:bg-primary/10"
                      >
                        Ver produtos →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Cadastre-se e receba ofertas exclusivas
            </h2>
            <p className="text-lg mb-8 text-primary-foreground/90">
              Seja o primeiro a saber sobre lançamentos e promoções especiais
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => setShowAuth(true)}
              className="text-lg px-8"
            >
              Cadastrar Agora
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary/5 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <Sparkles className="h-6 w-6" />
              <span className="text-xl font-bold">Boticário</span>
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
