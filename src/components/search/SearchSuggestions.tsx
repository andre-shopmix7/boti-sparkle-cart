import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchSuggestionsProps {
  query: string;
  onSelectSuggestion: (suggestion: string) => void;
  isVisible: boolean;
}

interface Suggestion {
  text: string;
  type: 'product' | 'brand' | 'recent';
}

export const SearchSuggestions = ({ query, onSelectSuggestion, isVisible }: SearchSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      fetchSuggestions(query);
    } else {
      setSuggestions(getRecentSuggestions());
    }
  }, [query, recentSearches]);

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      // Buscar produtos similares
      const { data: products, error } = await supabase
        .from("products")
        .select("name, brand")
        .eq("is_active", true)
        .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
        .limit(5);

      if (!error && products) {
        const productSuggestions: Suggestion[] = products
          .map(p => ({ text: p.name, type: 'product' as const }));
        
        const brandSuggestions: Suggestion[] = [...new Set(products.map(p => p.brand))]
          .filter(brand => brand)
          .map(brand => ({ text: brand, type: 'brand' as const }));

        setSuggestions([...productSuggestions, ...brandSuggestions]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions(getRecentSuggestions());
    }
  };

  const getRecentSuggestions = (): Suggestion[] => {
    return recentSearches.slice(0, 5).map(search => ({
      text: search,
      type: 'recent' as const
    }));
  };

  const handleSelectSuggestion = (suggestion: string) => {
    // Adicionar às pesquisas recentes
    const updatedRecent = [suggestion, ...recentSearches.filter(s => s !== suggestion)].slice(0, 10);
    setRecentSearches(updatedRecent);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
    
    onSelectSuggestion(suggestion);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recent':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
      <CardContent className="p-0">
        <div className="max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start px-4 py-3 h-auto rounded-none hover:bg-muted"
              onClick={() => handleSelectSuggestion(suggestion.text)}
            >
              {getSuggestionIcon(suggestion.type)}
              <span className="ml-3 truncate">{suggestion.text}</span>
              {suggestion.type === 'brand' && (
                <span className="ml-auto text-xs text-muted-foreground">marca</span>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};