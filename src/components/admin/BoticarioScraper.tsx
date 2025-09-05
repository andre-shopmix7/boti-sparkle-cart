import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Globe, Download, AlertCircle, CheckCircle2 } from "lucide-react";

interface BoticarioProduct {
  name: string;
  brand: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  rating?: number;
  reviewCount?: number;
  installments?: number;
  installmentPrice?: number;
  imageUrl?: string;
  productUrl?: string;
}

export const BoticarioScraper = () => {
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    total: number;
    success: number;
    errors: string[];
    products: BoticarioProduct[];
  } | null>(null);
  const { toast } = useToast();

  // Categories to scrape from Boticário
  const categories = [
    { name: 'Perfumes Masculinos', url: 'https://www.boticario.com.br/perfumaria/perfumes-masculinos/' },
    { name: 'Perfumes Femininos', url: 'https://www.boticario.com.br/perfumaria/perfumes-femininos/' },
    { name: 'Maquiagem', url: 'https://www.boticario.com.br/maquiagem/' },
    { name: 'Cuidados com o Rosto', url: 'https://www.boticario.com.br/cuidados/rosto/' },
    { name: 'Cuidados com o Corpo', url: 'https://www.boticario.com.br/cuidados/corpo/' },
    { name: 'Cabelos', url: 'https://www.boticario.com.br/cabelos/' }
  ];

  const extractProductFromHtml = (html: string, baseUrl: string): BoticarioProduct[] => {
    const products: BoticarioProduct[] = [];
    
    try {
      // Create a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Look for product containers (this selector may need adjustment)
      const productElements = doc.querySelectorAll('[data-testid="product-card"], .product-card, .produto-item, .item-produto');
      
      productElements.forEach((element) => {
        try {
          // Extract product name
          const nameElement = element.querySelector('h3, .produto-nome, .product-name, [data-testid="product-name"]');
          const name = nameElement?.textContent?.trim();
          
          if (!name) return;

          // Extract price
          const priceElement = element.querySelector('.price, .preco, [data-testid="product-price"]');
          const priceText = priceElement?.textContent?.replace(/[^\d,]/g, '').replace(',', '.') || '0';
          const price = parseFloat(priceText) || 0;

          if (price === 0) return;

          // Extract original price (if on sale)
          const originalPriceElement = element.querySelector('.original-price, .preco-original, [data-testid="original-price"]');
          const originalPriceText = originalPriceElement?.textContent?.replace(/[^\d,]/g, '').replace(',', '.') || '';
          const originalPrice = originalPriceText ? parseFloat(originalPriceText) : undefined;

          // Calculate discount percentage
          let discountPercentage = 0;
          if (originalPrice && originalPrice > price) {
            discountPercentage = Math.round(((originalPrice - price) / originalPrice) * 100);
          }

          // Extract rating
          const ratingElement = element.querySelector('[data-testid="product-rating"], .rating, .avaliacao');
          const ratingText = ratingElement?.textContent || '0';
          const rating = parseFloat(ratingText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

          // Extract image URL
          const imageElement = element.querySelector('img') as HTMLImageElement;
          const imageUrl = imageElement?.src || imageElement?.getAttribute('data-src');

          // Extract product URL
          const linkElement = element.querySelector('a') as HTMLAnchorElement;
          const productUrl = linkElement?.href;

          // Extract installments info
          const installmentElement = element.querySelector('.installments, .parcelas, [data-testid="installments"]');
          const installmentText = installmentElement?.textContent || '';
          const installmentMatch = installmentText.match(/(\d+)\s*x\s*R?\$?\s*([\d,]+)/);
          const installments = installmentMatch ? parseInt(installmentMatch[1]) : 1;
          const installmentPrice = installmentMatch ? parseFloat(installmentMatch[2].replace(',', '.')) : price;

          products.push({
            name,
            brand: 'Boticário',
            price,
            originalPrice,
            discountPercentage,
            rating: rating > 0 ? rating : undefined,
            installments,
            installmentPrice,
            imageUrl,
            productUrl
          });
        } catch (error) {
          console.error('Error extracting product:', error);
        }
      });
    } catch (error) {
      console.error('Error parsing HTML:', error);
    }

    return products;
  };

  const scrapePage = async (url: string): Promise<BoticarioProduct[]> => {
    try {
      // Use a CORS proxy to fetch the page
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      const html = data.contents;
      
      return extractProductFromHtml(html, url);
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return [];
    }
  };

  const insertProducts = async (products: BoticarioProduct[]) => {
    const errors: string[] = [];
    let success = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      setProgress(((i + 1) / products.length) * 100);
      
      try {
        // Check if product already exists
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('name', product.name)
          .eq('brand', product.brand)
          .single();

        if (existing) {
          errors.push(`Produto já existe: ${product.name}`);
          continue;
        }

        const { error } = await supabase
          .from('products')
          .insert({
            name: product.name,
            brand: product.brand,
            description: product.description || `Produto ${product.name} da marca ${product.brand}`,
            price: product.price,
            original_price: product.originalPrice,
            discount_percentage: product.discountPercentage || 0,
            stock_quantity: 10, // Default stock
            rating: product.rating || 0,
            review_count: product.reviewCount || 0,
            installments: product.installments || 1,
            installment_price: product.installmentPrice,
            is_active: true,
            is_featured: false,
            tags: ['boticário', 'importado']
          });

        if (error) {
          errors.push(`Erro ao inserir ${product.name}: ${error.message}`);
        } else {
          success++;
        }
      } catch (error) {
        errors.push(`Erro inesperado para ${product.name}: ${error}`);
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return { success, errors };
  };

  const startScrapingWithEdgeFunction = async () => {
    setScraping(true);
    setProgress(0);
    setResults(null);
    
    try {
      toast({
        title: "Iniciando scraping",
        description: "Processando produtos do Boticário em background...",
      });

      const { data, error } = await supabase.functions.invoke('scrape-boticario', {
        body: { action: 'start' }
      });

      if (error) throw error;

      toast({
        title: "Scraping iniciado",
        description: "Os produtos estão sendo cadastrados em background. Verifique a lista de produtos em alguns minutos.",
      });

      // Simulate progress for UI feedback
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 10;
        setProgress(currentProgress);
        
        if (currentProgress >= 100) {
          clearInterval(progressInterval);
          setResults({
            total: 0,
            success: 0,
            errors: [],
            products: []
          });
        }
      }, 1000);

    } catch (error) {
      console.error('Error starting scraping:', error);
      toast({
        title: "Erro ao iniciar scraping",
        description: "Não foi possível iniciar o processo de importação",
        variant: "destructive"
      });
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect shadow-elegant">
        <CardHeader>
          <CardTitle className="font-luxury flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent" />
            Importar Produtos do Boticário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Esta ferramenta busca produtos diretamente do site oficial do Boticário e os cadastra automaticamente na sua base de produtos.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Categorias que serão importadas:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {categories.map((category, index) => (
                    <li key={index}>• {category.name}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Dados extraídos:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Nome do produto</li>
                  <li>• Preço atual e original</li>
                  <li>• Avaliações e notas</li>
                  <li>• Informações de parcelamento</li>
                  <li>• Imagens dos produtos</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={startScrapingWithEdgeFunction}
              disabled={scraping}
              className="w-full bg-gradient-luxury text-white shadow-glow"
              size="lg"
            >
              {scraping ? (
                <>
                  <Download className="h-4 w-4 mr-2 animate-spin" />
                  Importando produtos...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Iniciar Importação
                </>
              )}
            </Button>
          </div>

          {/* Progress */}
          {scraping && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {results.success} Produtos Salvos
                </Badge>
                <Badge variant="outline">
                  Total: {results.total}
                </Badge>
                {results.errors.length > 0 && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {results.errors.length} Erros
                  </Badge>
                )}
              </div>

              {results.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Problemas encontrados:</p>
                      <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                        {results.errors.slice(0, 10).map((error, index) => (
                          <li key={index} className="text-muted-foreground">
                            • {error}
                          </li>
                        ))}
                        {results.errors.length > 10 && (
                          <li className="text-muted-foreground">
                            ... e mais {results.errors.length - 10} problemas
                          </li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {results.products.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Produtos encontrados (primeiros 5):</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {results.products.slice(0, 5).map((product, index) => (
                      <div key={index} className="text-sm p-2 bg-muted rounded">
                        <strong>{product.name}</strong> - R$ {product.price.toFixed(2)}
                        {product.originalPrice && (
                          <span className="text-muted-foreground ml-2">
                            (de R$ {product.originalPrice.toFixed(2)})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-800">Aviso Importante</h4>
              <p className="text-sm text-yellow-700">
                Esta ferramenta faz scraping do site público do Boticário. Use com moderação para não sobrecarregar o servidor deles. 
                Os dados podem não estar 100% atualizados e alguns produtos podem não ser extraídos corretamente devido a mudanças na estrutura do site.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};