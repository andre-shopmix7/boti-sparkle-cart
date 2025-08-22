import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  ShoppingCart, 
  User, 
  Leaf, 
  LogOut,
  Menu
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onAuthClick: () => void;
}

export const Header = ({ cartItemsCount, onCartClick, onAuthClick }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    toast({
      title: "Busca",
      description: `Buscando por: ${searchQuery}`,
    });
  };

  const NavLinks = () => (
    <>
      <Button variant="ghost" className="text-primary hover:text-primary-foreground hover:bg-primary">
        Perfumaria
      </Button>
      <Button variant="ghost" className="text-primary hover:text-primary-foreground hover:bg-primary">
        Maquiagem
      </Button>
      <Button variant="ghost" className="text-primary hover:text-primary-foreground hover:bg-primary">
        Cabelos
      </Button>
      <Button variant="ghost" className="text-primary hover:text-primary-foreground hover:bg-primary">
        Corpo & Banho
      </Button>
      <Button variant="ghost" className="text-primary hover:text-primary-foreground hover:bg-primary">
        Rosto
      </Button>
    </>
  );

  return (
    <header className="bg-white/95 backdrop-blur-lg border-b border-border/20 shadow-elegant sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-gradient-luxury text-white text-center py-2 text-sm font-medium">
        <p>✨ Frete grátis em compras acima de R$ 199,00 ✨</p>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 text-primary">
            <Leaf className="h-8 w-8 text-accent" />
            <span className="text-xl font-luxury font-bold bg-gradient-luxury bg-clip-text text-transparent">
              Boticário
            </span>
          </div>

          {/* Search bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Button 
                type="submit" 
                size="sm" 
                className="absolute right-1 top-1 h-8 w-8 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* User actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCartClick}
              className="relative text-primary hover:text-primary-foreground hover:bg-primary"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            {/* User menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-primary hover:text-white hover:bg-gradient-luxury shadow-elegant"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-effect">
                  <DropdownMenuItem className="font-medium">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem>Meus Pedidos</DropdownMenuItem>
                  <DropdownMenuItem>Perfil</DropdownMenuItem>
                  <DropdownMenuItem>
                    <a href="/admin" className="flex items-center w-full">
                      Painel Admin
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onAuthClick}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Entrar
              </Button>
            )}

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden text-primary"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  {/* Mobile search */}
                  <form onSubmit={handleSearch} className="md:hidden">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Buscar produtos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                      />
                      <Button 
                        type="submit" 
                        size="sm" 
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                  
                  {/* Mobile nav */}
                  <div className="flex flex-col gap-2">
                    <NavLinks />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-1 mt-4 border-t border-primary/10 pt-4">
          <NavLinks />
        </nav>
      </div>
    </header>
  );
};