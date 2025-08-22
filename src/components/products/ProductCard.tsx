import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  rating: number;
  reviewCount: number;
  installments: number;
  installmentPrice: number;
  specialOffer?: string;
  imageUrl?: string;
  isFavorite?: boolean;
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (productId: string) => void;
}

export const ProductCard = ({
  id,
  name,
  brand,
  description,
  price,
  originalPrice,
  discountPercentage,
  rating,
  reviewCount,
  installments,
  installmentPrice,
  specialOffer,
  imageUrl,
  isFavorite = false,
  onToggleFavorite,
  onAddToCart,
}: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleToggleFavorite = () => {
    onToggleFavorite(id);
    toast.success(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
  };

  const handleAddToCart = () => {
    onAddToCart(id);
    toast.success("Produto adicionado ao carrinho");
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`text-sm ${
              i < Math.floor(rating) ? "text-accent" : "text-muted-foreground"
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <Card className="group relative h-full flex flex-col hover:shadow-lg transition-all duration-300 bg-card border-border">
      {/* Discount Badge */}
      {discountPercentage && discountPercentage > 0 && (
        <Badge className="absolute top-2 left-2 z-10 bg-emerald-600 text-white hover:bg-emerald-700">
          -{discountPercentage}%
        </Badge>
      )}

      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
        onClick={handleToggleFavorite}
      >
        <Heart
          className={`h-4 w-4 ${
            isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
          }`}
        />
      </Button>

      {/* Product Image */}
      <div className="relative aspect-square bg-muted rounded-t-lg overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
            <span className="text-primary font-medium text-lg">{brand}</span>
          </div>
        )}
      </div>

      <CardContent className="flex-1 p-4 space-y-2">
        {/* Special Offer */}
        {specialOffer && (
          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
            {specialOffer}
          </Badge>
        )}

        {/* Brand */}
        <p className="text-sm font-medium text-primary uppercase tracking-wide">
          {brand}
        </p>

        {/* Product Name */}
        <h3 className="font-medium text-foreground line-clamp-2 leading-tight">
          {name}
        </h3>

        {/* Rating */}
        <div className="flex items-center space-x-2">
          {renderStars(rating)}
          <span className="text-xs text-muted-foreground">({reviewCount})</span>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 space-y-3">
        {/* Price */}
        <div className="w-full space-y-1">
          {originalPrice && (
            <p className="text-sm text-muted-foreground line-through">
              R$ {originalPrice.toFixed(2).replace(".", ",")}
            </p>
          )}
          <p className="text-xl font-bold text-foreground">
            R$ {price.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-sm text-muted-foreground">
            em {installments}x de R$ {installmentPrice.toFixed(2).replace(".", ",")}
          </p>
        </div>

        {/* Add to Cart Button */}
        <Button 
          onClick={handleAddToCart}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </CardFooter>
    </Card>
  );
};