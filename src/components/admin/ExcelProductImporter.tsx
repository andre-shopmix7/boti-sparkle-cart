import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import * as XLSX from 'xlsx';

interface ProductRow {
  nome: string;
  marca?: string;
  descricao?: string;
  preco: number;
  preco_original?: number;
  desconto?: number;
  estoque: number;
  avaliacao?: number;
  avaliacoes_count?: number;
  parcelas?: number;
  preco_parcela?: number;
  categoria?: string;
  tags?: string;
  oferta_especial?: string;
}

export const ExcelProductImporter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    total: number;
    success: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        '.xlsx',
        '.xls'
      ];
      
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setResults(null);
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
          variant: "destructive"
        });
      }
    }
  };

  const parseExcelFile = (file: File): Promise<ProductRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const products: ProductRow[] = jsonData.map((row: any) => ({
            nome: row['Nome'] || row['nome'] || row['NOME'] || '',
            marca: row['Marca'] || row['marca'] || row['MARCA'] || 'Boticário',
            descricao: row['Descrição'] || row['descricao'] || row['DESCRIÇÃO'] || '',
            preco: parseFloat(row['Preço'] || row['preco'] || row['PREÇO'] || '0'),
            preco_original: parseFloat(row['Preço Original'] || row['preco_original'] || '0') || undefined,
            desconto: parseInt(row['Desconto'] || row['desconto'] || '0') || undefined,
            estoque: parseInt(row['Estoque'] || row['estoque'] || row['ESTOQUE'] || '0'),
            avaliacao: parseFloat(row['Avaliação'] || row['avaliacao'] || '0') || undefined,
            avaliacoes_count: parseInt(row['Avaliações'] || row['avaliacoes'] || '0') || undefined,
            parcelas: parseInt(row['Parcelas'] || row['parcelas'] || '1') || 1,
            preco_parcela: parseFloat(row['Preço Parcela'] || row['preco_parcela'] || '0') || undefined,
            categoria: row['Categoria'] || row['categoria'] || '',
            tags: row['Tags'] || row['tags'] || '',
            oferta_especial: row['Oferta'] || row['oferta'] || ''
          }));
          
          resolve(products);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const importProducts = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setResults(null);

    try {
      const products = await parseExcelFile(file);
      const total = products.length;
      let success = 0;
      const errors: string[] = [];

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        setProgress(((i + 1) / total) * 100);

        try {
          // Validar dados obrigatórios
          if (!product.nome || product.preco <= 0) {
            errors.push(`Linha ${i + 2}: Nome e preço são obrigatórios`);
            continue;
          }

          // Converter tags string para array
          const tagsArray = product.tags ? product.tags.split(',').map(tag => tag.trim()) : [];

          const { error } = await supabase
            .from('products')
            .insert({
              name: product.nome,
              brand: product.marca,
              description: product.descricao,
              price: product.preco,
              original_price: product.preco_original,
              discount_percentage: product.desconto || 0,
              stock_quantity: product.estoque,
              rating: product.avaliacao || 0,
              review_count: product.avaliacoes_count || 0,
              installments: product.parcelas || 1,
              installment_price: product.preco_parcela,
              special_offer: product.oferta_especial,
              tags: tagsArray,
              is_active: true,
              is_featured: false
            });

          if (error) {
            errors.push(`Linha ${i + 2}: ${error.message}`);
          } else {
            success++;
          }
        } catch (error) {
          errors.push(`Linha ${i + 2}: Erro inesperado - ${error}`);
        }
      }

      setResults({ total, success, errors });
      
      if (success > 0) {
        toast({
          title: "Importação concluída",
          description: `${success} produtos importados com sucesso de ${total} total`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Erro ao processar o arquivo Excel",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect shadow-elegant">
        <CardHeader>
          <CardTitle className="font-luxury flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-accent" />
            Importar Produtos via Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload de arquivo */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="excel-file">Arquivo Excel (.xlsx ou .xls)</Label>
              <div className="mt-2 flex items-center gap-4">
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="flex-1"
                />
                {file && (
                  <Badge variant="secondary" className="bg-accent/10 text-accent">
                    {file.name}
                  </Badge>
                )}
              </div>
            </div>

            {file && (
              <Button
                onClick={importProducts}
                disabled={importing}
                className="w-full bg-gradient-luxury text-white shadow-glow"
              >
                {importing ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Produtos
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Progresso */}
          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importando produtos...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Resultados */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {results.success} Sucessos
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
                      <p className="font-medium">Erros encontrados:</p>
                      <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                        {results.errors.slice(0, 10).map((error, index) => (
                          <li key={index} className="text-muted-foreground">
                            • {error}
                          </li>
                        ))}
                        {results.errors.length > 10 && (
                          <li className="text-muted-foreground">
                            ... e mais {results.errors.length - 10} erros
                          </li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="font-luxury text-lg">Formato do Excel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              O arquivo Excel deve conter as seguintes colunas (nomes podem variar):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium">Colunas Obrigatórias:</h4>
                <ul className="space-y-1 text-muted-foreground mt-2">
                  <li>• <strong>Nome</strong> - Nome do produto</li>
                  <li>• <strong>Preço</strong> - Preço do produto</li>
                  <li>• <strong>Estoque</strong> - Quantidade em estoque</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Colunas Opcionais:</h4>
                <ul className="space-y-1 text-muted-foreground mt-2">
                  <li>• <strong>Marca</strong> - Marca do produto</li>
                  <li>• <strong>Descrição</strong> - Descrição detalhada</li>
                  <li>• <strong>Preço Original</strong> - Preço antes do desconto</li>
                  <li>• <strong>Desconto</strong> - Percentual de desconto</li>
                  <li>• <strong>Avaliação</strong> - Nota do produto (0-5)</li>
                  <li>• <strong>Parcelas</strong> - Número de parcelas</li>
                  <li>• <strong>Tags</strong> - Tags separadas por vírgula</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};