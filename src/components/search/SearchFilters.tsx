import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
}

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export interface SearchFilters {
  categoryId?: string;
  priceRange: [number, number];
  sortBy: string;
  brand?: string;
}

export const SearchFilters = ({ onFiltersChange, isOpen, onToggle }: SearchFiltersProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    priceRange: [0, 1000],
    sortBy: "created_at_desc",
  });

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("brand")
      .eq("is_active", true)
      .not("brand", "is", null);
    
    if (!error && data) {
      const uniqueBrands = [...new Set(data.map(item => item.brand))].sort();
      setBrands(uniqueBrands);
    }
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      priceRange: [0, 1000] as [number, number],
      sortBy: "created_at_desc",
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const activeFiltersCount = [
    filters.categoryId,
    filters.brand,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 1000,
  ].filter(Boolean).length;

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={onToggle}
        className="flex items-center gap-2"
      >
        <Filter className="h-4 w-4" />
        Filtros
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filtros</h3>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={filters.categoryId || ""}
              onValueChange={(value) => updateFilters({ categoryId: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Marca */}
          <div className="space-y-2">
            <Label>Marca</Label>
            <Select
              value={filters.brand || ""}
              onValueChange={(value) => updateFilters({ brand: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as marcas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as marcas</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Faixa de Preço */}
          <div className="space-y-2">
            <Label>Faixa de Preço</Label>
            <div className="px-2">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                max={1000}
                min={0}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>R$ {filters.priceRange[0]}</span>
                <span>R$ {filters.priceRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Ordenação */}
          <div className="space-y-2">
            <Label>Ordenar por</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => updateFilters({ sortBy: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Mais recentes</SelectItem>
                <SelectItem value="created_at_asc">Mais antigos</SelectItem>
                <SelectItem value="price_asc">Menor preço</SelectItem>
                <SelectItem value="price_desc">Maior preço</SelectItem>
                <SelectItem value="name_asc">Nome A-Z</SelectItem>
                <SelectItem value="name_desc">Nome Z-A</SelectItem>
                <SelectItem value="rating_desc">Melhor avaliados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};