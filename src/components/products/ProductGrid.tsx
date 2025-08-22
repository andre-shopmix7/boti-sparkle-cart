import { ProductCard } from "./ProductCard";

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  rating: number;
  review_count: number;
  installments: number;
  installment_price: number;
  special_offer?: string;
  image_url?: string;
  is_favorite?: boolean;
}

interface ProductGridProps {
  products: Product[];
  favorites: string[];
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  isLoading?: boolean;
}

export const ProductGrid = ({
  products,
  favorites,
  onToggleFavorite,
  onAddToCart,
  isLoading = false,
}: ProductGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-square bg-muted animate-pulse rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-6xl">🔍</div>
        <h3 className="text-xl font-semibold text-foreground">Nenhum produto encontrado</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Não encontramos produtos que correspondam aos seus critérios de busca. 
          Tente ajustar os filtros ou usar outros termos.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          brand={product.brand}
          description={product.description || ""}
          price={product.price}
          originalPrice={product.original_price}
          discountPercentage={product.discount_percentage}
          rating={product.rating}
          reviewCount={product.review_count}
          installments={product.installments}
          installmentPrice={product.installment_price}
          specialOffer={product.special_offer}
          imageUrl={product.image_url}
          isFavorite={favorites.includes(product.id)}
          onToggleFavorite={onToggleFavorite}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};