import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Image as ImageIcon,
  Monitor
} from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  button_text?: string;
  button_link?: string;
  background_color: string;
  text_color: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface BannerFormData {
  title: string;
  subtitle: string;
  image_url: string;
  button_text: string;
  button_link: string;
  background_color: string;
  text_color: string;
  is_active: boolean;
  display_order: number;
}

export const BannerManagement = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BannerFormData>({
    title: "",
    subtitle: "",
    image_url: "",
    button_text: "",
    button_link: "",
    background_color: "#8B4513",
    text_color: "#FFFFFF",
    is_active: true,
    display_order: 0,
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar banners.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleInputChange = (field: keyof BannerFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      button_text: "",
      button_link: "",
      background_color: "#8B4513",
      text_color: "#FFFFFF",
      is_active: true,
      display_order: 0,
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image_url: banner.image_url || "",
      button_text: banner.button_text || "",
      button_link: banner.button_link || "",
      background_color: banner.background_color,
      text_color: banner.text_color,
      is_active: banner.is_active,
      display_order: banner.display_order,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingBanner) {
        // Update existing banner
        const { error } = await supabase
          .from("banners")
          .update({
            title: formData.title,
            subtitle: formData.subtitle || null,
            image_url: formData.image_url || null,
            button_text: formData.button_text || null,
            button_link: formData.button_link || null,
            background_color: formData.background_color,
            text_color: formData.text_color,
            is_active: formData.is_active,
            display_order: formData.display_order,
          })
          .eq("id", editingBanner.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso!",
          description: "Banner atualizado com sucesso.",
        });
      } else {
        // Create new banner
        const { error } = await supabase
          .from("banners")
          .insert({
            title: formData.title,
            subtitle: formData.subtitle || null,
            image_url: formData.image_url || null,
            button_text: formData.button_text || null,
            button_link: formData.button_link || null,
            background_color: formData.background_color,
            text_color: formData.text_color,
            is_active: formData.is_active,
            display_order: formData.display_order,
          });

        if (error) throw error;
        
        toast({
          title: "Sucesso!",
          description: "Banner criado com sucesso.",
        });
      }

      await fetchBanners();
      resetForm();
    } catch (error) {
      console.error("Error saving banner:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar banner. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm("Tem certeza que deseja excluir este banner?")) return;

    try {
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", bannerId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Banner excluído com sucesso.",
      });

      await fetchBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir banner.",
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
            <p className="text-muted-foreground">Carregando banners...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-luxury rounded-lg">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-luxury font-semibold">Gerenciar Banners</h2>
            <p className="text-muted-foreground">
              {banners.length} banner{banners.length !== 1 ? 's' : ''} cadastrado{banners.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-luxury text-white shadow-glow hover:shadow-luxury"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Banner
        </Button>
      </div>

      {/* Banner Form */}
      {showForm && (
        <Card className="glass-effect shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-luxury">
                {editingBanner ? "Editar Banner" : "Novo Banner"}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Título do banner"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ordem de Exibição</label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subtítulo</label>
                <Textarea
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  placeholder="Descrição do banner"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL da Imagem</label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Texto do Botão</label>
                  <Input
                    value={formData.button_text}
                    onChange={(e) => handleInputChange('button_text', e.target.value)}
                    placeholder="Ver Ofertas"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Link do Botão</label>
                  <Input
                    value={formData.button_link}
                    onChange={(e) => handleInputChange('button_link', e.target.value)}
                    placeholder="/products"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cor de Fundo</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => handleInputChange('background_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) => handleInputChange('background_color', e.target.value)}
                      placeholder="#8B4513"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Cor do Texto</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => handleInputChange('text_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={formData.text_color}
                      onChange={(e) => handleInputChange('text_color', e.target.value)}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <label className="text-sm font-medium">Banner Ativo</label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-luxury text-white shadow-glow hover:shadow-luxury"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Banners List */}
      <div className="grid gap-4">
        {banners.map((banner) => (
          <Card key={banner.id} className="glass-effect shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-luxury font-semibold text-lg">{banner.title}</h3>
                    <Badge variant={banner.is_active ? "default" : "secondary"}>
                      {banner.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Ordem: {banner.display_order}
                    </Badge>
                  </div>
                  
                  {banner.subtitle && (
                    <p className="text-muted-foreground mb-2">{banner.subtitle}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {banner.image_url && (
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        <span>Com imagem</span>
                      </div>
                    )}
                    
                    {banner.button_text && (
                      <span>Botão: "{banner.button_text}"</span>
                    )}
                    
                    <div 
                      className="w-4 h-4 rounded border border-border"
                      style={{ backgroundColor: banner.background_color }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(banner)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(banner.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {banners.length === 0 && (
          <Card className="glass-effect shadow-elegant">
            <CardContent className="py-12">
              <div className="text-center">
                <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-luxury font-semibold mb-2">Nenhum banner encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro banner promocional para a página inicial.
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-luxury text-white shadow-glow hover:shadow-luxury"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Banner
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};