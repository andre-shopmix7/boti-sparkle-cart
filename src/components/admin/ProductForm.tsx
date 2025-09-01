import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Save, Upload, Sparkles, Package } from "lucide-react";

interface ProductFormState {
  name: string;
  brand: string;
  description: string;
  price: string;
  original_price: string;
  discount_percentage: string;
  stock_quantity: string;
  installments: string;
  installment_price: string;
  special_offer: string;
  tags: string;
  is_featured: boolean;
  is_active: boolean;
}

interface ProductFormProps {
  editingProduct?: any;
  onBack?: () => void;
}

export const ProductForm = ({ editingProduct, onBack }: ProductFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<ProductFormState>({
    name: "",
    brand: "",
    description: "",
    price: "",
    original_price: "",
    discount_percentage: "",
    stock_quantity: "",
    installments: "1",
    installment_price: "",
    special_offer: "",
    tags: "",
    is_featured: false,
    is_active: true,
  });

  // Populate form when editing
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || "",
        brand: editingProduct.brand || "",
        description: editingProduct.description || "",
        price: editingProduct.price?.toString() || "",
        original_price: editingProduct.original_price?.toString() || "",
        discount_percentage: editingProduct.discount_percentage?.toString() || "",
        stock_quantity: editingProduct.stock_quantity?.toString() || "",
        installments: editingProduct.installments?.toString() || "1",
        installment_price: editingProduct.installment_price?.toString() || "",
        special_offer: editingProduct.special_offer || "",
        tags: editingProduct.tags?.join(", ") || "",
        is_featured: editingProduct.is_featured || false,
        is_active: editingProduct.is_active ?? true,
      });
    }
  }, [editingProduct]);

  const handleInputChange = (field: keyof ProductFormState, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.brand || !formData.price || !formData.stock_quantity) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Convert string values to numbers
      const productData = {
        name: formData.name,
        brand: formData.brand,
        description: formData.description || null,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : 0,
        stock_quantity: parseInt(formData.stock_quantity),
        installments: formData.installments ? parseInt(formData.installments) : 1,
        installment_price: formData.installment_price ? parseFloat(formData.installment_price) : null,
        special_offer: formData.special_offer || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        rating: 5.0,
        review_count: 0,
      };

      const { data: product, error } = editingProduct 
        ? await supabase
            .from("products")
            .update(productData)
            .eq("id", editingProduct.id)
            .select()
            .single()
        : await supabase
            .from("products")
            .insert(productData)
            .select()
            .single();

      if (error) throw error;

      // Upload image if provided
      if (imageFile && product) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${product.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

          // Save image URL to product_images table
          await supabase
            .from('product_images')
            .insert({
              product_id: product.id,
              image_url: publicUrl,
              is_primary: true,
              display_order: 0
            });
        }
      }

      toast({
        title: "Sucesso!",
        description: editingProduct ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.",
      });

      // Reset form or go back
      if (editingProduct && onBack) {
        onBack();
      } else {
        setFormData({
          name: "",
          brand: "",
          description: "",
          price: "",
          original_price: "",
          discount_percentage: "",
          stock_quantity: "",
          installments: "1",
          installment_price: "",
          special_offer: "",
          tags: "",
          is_featured: false,
          is_active: true,
        });
        setImageFile(null);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-luxury rounded-lg">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-luxury font-semibold">
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </h2>
            <p className="text-muted-foreground">
              {editingProduct ? "Atualize as informações do produto" : "Cadastre um novo produto na loja"}
            </p>
          </div>
        </div>
        
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
        )}
      </div>

      <Card className="glass-effect shadow-elegant">
        <CardHeader>
          <CardTitle className="font-luxury flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Informações do Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Produto *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Combo Nativa Spa Ameixa"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Marca *</label>
                <Input
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="Ex: NATIVA SPA"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Preço (R$) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="86.90"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Preço Original (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => handleInputChange('original_price', e.target.value)}
                  placeholder="154.80"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Desconto (%)</label>
                <Input
                  type="number"
                  value={formData.discount_percentage}
                  onChange={(e) => handleInputChange('discount_percentage', e.target.value)}
                  placeholder="43"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantidade em Estoque *</label>
                <Input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                  placeholder="50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Parcelas</label>
                <Input
                  type="number"
                  value={formData.installments}
                  onChange={(e) => handleInputChange('installments', e.target.value)}
                  placeholder="4"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Valor da Parcela (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.installment_price}
                  onChange={(e) => handleInputChange('installment_price', e.target.value)}
                  placeholder="21.73"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o produto..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Oferta Especial</label>
                <Input
                  value={formData.special_offer}
                  onChange={(e) => handleInputChange('special_offer', e.target.value)}
                  placeholder="COMPRE E LEVE REFIL"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (separadas por vírgula)</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="hidratante, perfumado, refil"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Imagem do Produto</label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="border-dashed"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Imagem
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imageFile && (
                  <Badge variant="secondary" className="bg-accent/10 text-accent">
                    {imageFile.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Switches */}
            <div className="flex gap-8">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                />
                <label className="text-sm font-medium">Produto em Destaque</label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <label className="text-sm font-medium">Produto Ativo</label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-luxury text-white shadow-glow hover:shadow-luxury transition-all duration-300"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Salvando..." : (editingProduct ? "Atualizar Produto" : "Salvar Produto")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};