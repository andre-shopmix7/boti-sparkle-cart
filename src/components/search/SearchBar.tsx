import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = "Buscar produtos...",
  className = "",
}: SearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  const handleClear = () => {
    onChange("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className={`relative transition-all duration-200 ${
        isFocused ? "scale-105" : ""
      }`}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="pl-10 pr-20 h-12 text-base bg-background border-border focus:border-primary focus:ring-primary/20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4"
          >
            Buscar
          </Button>
        </div>
      </div>
    </form>
  );
};