import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star,
  Package,
  Calculator,
  Receipt,
  TrendingUp,
  Warehouse
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price?: number;
  discount_percentage: number;
  stock_quantity: number;
  rating: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  special_offer?: string;
  cost_price?: number;
  purchase_date?: string;
  invoice_number?: string;
  admin_notes?: string;
  profit_percentage?: number;
  profit_amount?: number;
  inventory_value?: number;
  created_at: string;
}

interface ProductListProps {
  onEditProduct?: (product: Product) => void;
}

export const ProductList = ({ onEditProduct }: ProductListProps) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(p => 
        p.id === productId ? { ...p, is_active: !currentStatus } : p
      ));

      toast({
        title: "Sucesso",
        description: `Produto ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do produto.",
        variant: "destructive",
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir produto.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="glass-effect shadow-elegant">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando produtos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-luxury rounded-lg">
          <Package className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-luxury font-semibold">Gerenciar Produtos</h2>
          <p className="text-muted-foreground">
            {products.length} produtos cadastrados
          </p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-effect shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Valor Total Estoque</span>
            </div>
            <p className="text-xl font-bold text-accent">
              R$ {products
                .filter(p => p.inventory_value)
                .reduce((sum, p) => sum + (p.inventory_value || 0), 0)
                .toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Ganho Potencial</span>
            </div>
            <p className="text-xl font-bold text-green-600">
              R$ {products
                .filter(p => p.profit_amount && p.stock_quantity)
                .reduce((sum, p) => sum + ((p.profit_amount || 0) * p.stock_quantity), 0)
                .toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Warehouse className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Itens em Estoque</span>
            </div>
            <p className="text-xl font-bold text-blue-600">
              {products.reduce((sum, p) => sum + p.stock_quantity, 0)} un.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-effect shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-luxury">Lista de Produtos</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Preço / Custo</TableHead>
                  <TableHead>Ganho</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.brand}</p>
                        {product.special_offer && (
                          <Badge variant="secondary" className="mt-1 text-xs bg-accent/10 text-accent">
                            {product.special_offer}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">R$ {product.price.toFixed(2)}</p>
                        {product.original_price && (
                          <p className="text-sm text-muted-foreground line-through">
                            R$ {product.original_price.toFixed(2)}
                          </p>
                        )}
                        {product.discount_percentage > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            -{product.discount_percentage}%
                          </Badge>
                        )}
                        {product.cost_price && (
                          <div className="text-xs text-muted-foreground mt-1">
                            <span>Custo: R$ {product.cost_price.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.cost_price && product.profit_percentage !== undefined ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              {product.profit_percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-xs text-green-600">
                            R$ {product.profit_amount?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Não calculado
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={product.stock_quantity > 10 ? "default" : "destructive"}>
                          {product.stock_quantity} un.
                        </Badge>
                        {product.cost_price && product.inventory_value && (
                          <div className="text-xs text-muted-foreground">
                            <Warehouse className="h-3 w-3 inline mr-1" />
                            R$ {product.inventory_value.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span className="font-medium">{product.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({product.review_count})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        {product.is_featured && (
                          <Badge variant="outline" className="text-xs border-accent text-accent">
                            Destaque
                          </Badge>
                        )}
                        {product.invoice_number && (
                          <div className="text-xs text-muted-foreground">
                            <Receipt className="h-3 w-3 inline mr-1" />
                            {product.invoice_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleProductStatus(product.id, product.is_active)}
                          title={product.is_active ? "Desativar" : "Ativar"}
                        >
                          {product.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditProduct?.(product)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                          title="Excluir"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};