import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SearchFilters } from "@/components/search/SearchFilters";

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
  category_id?: string;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProducts = async (query = "", filters?: SearchFilters) => {
    try {
      setLoading(true);
      
      // Use the public function for fetching products
      const { data: productsData, error: productsError } = await supabase
        .rpc("get_public_products");

      if (productsError) {
        toast.error("Erro ao buscar produtos");
        console.error("Error fetching products:", productsError);
        return;
      }

      let filteredProducts = productsData || [];

      // Apply text search
      if (query.trim()) {
        const searchTerm = query.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.brand.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm)
        );
      }

      // Apply filters
      if (filters) {
        if (filters.categoryId) {
          filteredProducts = filteredProducts.filter(product => 
            product.category_id === filters.categoryId
          );
        }
        
        if (filters.brand) {
          filteredProducts = filteredProducts.filter(product => 
            product.brand === filters.brand
          );
        }

        if (filters.priceRange) {
          filteredProducts = filteredProducts.filter(product => 
            product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
          );
        }

        // Apply sorting
        switch (filters.sortBy) {
          case "price_asc":
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
          case "price_desc":
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
          case "name_asc":
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case "name_desc":
            filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
          case "rating_desc":
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
          case "created_at_asc":
            filteredProducts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            break;
          default:
            filteredProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
      } else {
        filteredProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      // Fetch product images
      const { data: imagesData, error: imagesError } = await supabase
        .from("product_images")
        .select("*")
        .order("display_order", { ascending: true });

      if (imagesError) {
        console.error("Error fetching product images:", imagesError);
      }

      // Combine products with their images
      const productsWithImages = filteredProducts.map(product => ({
        ...product,
        product_images: imagesData?.filter(img => img.product_id === product.id) || []
      }));

      setProducts(productsWithImages);
      setProductImages(imagesData || []);
    } catch (error) {
      console.error("Error in fetchProducts:", error);
      toast.error("Erro inesperado ao buscar produtos");
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = (query: string, filters?: SearchFilters) => {
    setSearchQuery(query);
    fetchProducts(query, filters);
  };

  // Get primary image for a product
  const getProductImage = (productId: string) => {
    const primaryImage = productImages.find(
      (img) => img.product_id === productId && img.is_primary
    );
    
    if (primaryImage) return primaryImage.image_url;
    
    const firstImage = productImages.find(
      (img) => img.product_id === productId
    );
    
    return firstImage?.image_url;
  };

  // Get products with their primary images
  const getProductsWithImages = () => {
    return products.map((product) => ({
      ...product,
      image_url: getProductImage(product.id),
    }));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products: getProductsWithImages(),
    loading,
    searchQuery,
    searchProducts,
    refetch: () => fetchProducts(searchQuery),
  };
};