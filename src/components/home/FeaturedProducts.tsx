import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { Heart, ShoppingCart, Star, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const FeaturedProducts = () => {
  const { products, loading } = useProducts();
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();

  if (loading) {
    return (
      <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <Card key={index} className="glass-effect animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-4"></div>
                  <div className="h-6 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Get featured products (limited to 8)
  const featuredProducts = products
    .filter(product => product.is_featured)
    .slice(0, 8);

  if (featuredProducts.length === 0) {
    // If no featured products, show first 8 products
    featuredProducts.push(...products.slice(0, 8));
  }

  const handleToggleFavorite = (productId: string) => {
    toggleFavorite(productId);
  };

  const handleAddToCart = (productId: string) => {
    addToCart(productId, 1);
  };

  return (
    <section className="py-16 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-luxury font-bold text-foreground mb-4">
            Produtos em Destaque
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Descubra nossa seleção especial dos melhores produtos de beleza
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {featuredProducts.map((product) => {
            const isFavorite = favorites.some(fav => fav.product_id === product.id);
            const productImages = product.product_images || [];
            const primaryImage = productImages.find(img => img.is_primary) || productImages[0];

            return (
              <Card key={product.id} className="group glass-effect shadow-elegant hover:shadow-luxury transition-all duration-300 animate-luxury-scale">
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gradient-to-br from-accent/5 to-accent/10">
                    {primaryImage?.image_url ? (
                      <img
                        src={primaryImage.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGNUY1RjUiLz48cGF0aCBkPSJNNzUgNzVIMTI1VjEyNUg3NVY3NVoiIGZpbGw9IiNEMUQxRDEiLz48L3N2Zz4=";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <div className="text-center text-muted-foreground">
                          <div className="w-16 h-16 mx-auto mb-2 bg-accent/20 rounded-full flex items-center justify-center">
                            <ShoppingCart className="h-8 w-8" />
                          </div>
                          <p className="text-sm font-medium">{product.brand}</p>
                        </div>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {product.discount_percentage > 0 && (
                      <Badge className="absolute top-3 left-3 bg-destructive text-white font-bold">
                        -{product.discount_percentage}%
                      </Badge>
                    )}

                    {/* Special Offer Badge */}
                    {product.special_offer && (
                      <Badge className="absolute top-3 right-3 bg-accent text-white text-xs">
                        {product.special_offer}
                      </Badge>
                    )}

                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-10 h-10 p-0 bg-white/90 hover:bg-white shadow-elegant"
                        onClick={() => handleToggleFavorite(product.id)}
                      >
                        <Heart 
                          className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                        />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-10 h-10 p-0 bg-white/90 hover:bg-white shadow-elegant"
                        onClick={() => handleAddToCart(product.id)}
                      >
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {product.brand}
                      </p>
                      <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-accent transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(product.rating)
                                ? 'fill-accent text-accent'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({product.review_count})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-accent">
                          {formatCurrency(product.price)}
                        </span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(product.original_price)}
                          </span>
                        )}
                      </div>
                      
                      {product.installments > 1 && product.installment_price && (
                        <p className="text-xs text-muted-foreground">
                          ou {product.installments}x de {formatCurrency(product.installment_price)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View All Products Button */}
        <div className="text-center">
          <Link to="/products">
            <Button size="lg" className="bg-gradient-luxury text-white shadow-glow hover:shadow-luxury transition-all duration-300">
              Ver Todos os Produtos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};