import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { SearchBar } from "@/components/search/SearchBar";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useProducts } from "@/hooks/useProducts";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/components/auth/AuthPage";

export const Products = () => {
  const { user, loading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { products, loading: productsLoading, searchProducts } = useProducts();
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart, cartItemsCount } = useCart();

  const handleSearch = (query: string) => {
    searchProducts(query);
  };

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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

      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Buscar produtos, marcas ou categorias..."
              className="w-full"
            />
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {searchQuery ? `Resultados para "${searchQuery}"` : "Todos os Produtos"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {productsLoading ? "Carregando..." : `${products.length} produtos encontrados`}
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <ProductGrid
          products={products}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onAddToCart={addToCart}
          isLoading={productsLoading}
        />
      </main>
    </div>
  );
};