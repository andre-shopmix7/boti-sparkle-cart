import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const fetchProducts = async (query = "") => {
    try {
      setLoading(true);
      
      let queryBuilder = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (query.trim()) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`
        );
      }

      const { data: productsData, error: productsError } = await queryBuilder;

      if (productsError) {
        toast.error("Erro ao buscar produtos");
        console.error("Error fetching products:", productsError);
        return;
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
      const productsWithImages = (productsData || []).map(product => ({
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

  const searchProducts = (query: string) => {
    setSearchQuery(query);
    fetchProducts(query);
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