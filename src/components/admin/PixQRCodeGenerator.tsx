import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  QrCode, 
  Download, 
  Copy, 
  Search,
  Smartphone,
  Package,
  CreditCard,
  Check
} from "lucide-react";
import QRCode from "qrcode";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  is_active: boolean;
}

export const PixQRCodeGenerator = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pixKey, setPixKey] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [merchantCity, setMerchantCity] = useState("");
  const [txId, setTxId] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [pixCode, setPixCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      // Gera um TX ID único baseado no produto
      const timestamp = Date.now().toString().slice(-6);
      setTxId(`${selectedProduct.id.slice(0, 8)}${timestamp}`);
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_admin_products' as any);

      if (error) throw error;
      
      const activeProducts = (data as Product[])?.filter(p => p.is_active) || [];
      setProducts(activeProducts);
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

  const generatePixPayload = () => {
    if (!selectedProduct || !pixKey || !merchantName || !merchantCity) {
      return "";
    }

    // Formatação do payload PIX EMV
    const formatEMV = (id: string, value: string) => {
      const length = value.length.toString().padStart(2, '0');
      return `${id}${length}${value}`;
    };

    // Merchant Account Information (PIX)
    const merchantAccountInfo = formatEMV("00", "BR.GOV.BCB.PIX") + formatEMV("01", pixKey);
    const merchantAccountInfoFormatted = formatEMV("26", merchantAccountInfo);

    // Merchant Category Code (outras transações)
    const merchantCategoryCode = "52040000";

    // Transaction Currency (Real Brasileiro)
    const transactionCurrency = "5303986";

    // Transaction Amount
    const amount = selectedProduct.price.toFixed(2);
    const transactionAmount = `54${amount.length.toString().padStart(2, '0')}${amount}`;

    // Country Code
    const countryCode = "5802BR";

    // Merchant Name
    const merchantNameFormatted = formatEMV("59", merchantName);

    // Merchant City
    const merchantCityFormatted = formatEMV("60", merchantCity);

    // Additional Data Field (TX ID)
    const additionalDataField = formatEMV("05", txId);
    const additionalData = formatEMV("62", additionalDataField);

    // Monta o payload sem CRC
    const payloadWithoutCRC = 
      "000201" + // Payload Format Indicator
      "010212" + // Point of Initiation Method (12 = QR code estático reutilizável)
      merchantAccountInfoFormatted +
      merchantCategoryCode +
      transactionCurrency +
      transactionAmount +
      countryCode +
      merchantNameFormatted +
      merchantCityFormatted +
      additionalData +
      "6304"; // CRC16 placeholder

    // Calcula CRC16
    const crc16 = calculateCRC16(payloadWithoutCRC);
    
    return payloadWithoutCRC + crc16;
  };

  // Função para calcular CRC16-CCITT
  const calculateCRC16 = (payload: string): string => {
    let crc = 0xFFFF;
    
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
        crc &= 0xFFFF;
      }
    }
    
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  const generateQRCode = async () => {
    const payload = generatePixPayload();
    
    if (!payload) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const dataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        margin: 2,
        scale: 8,
        width: 512,
      });
      
      setQrCodeDataUrl(dataUrl);
      setPixCode(payload);
      
      toast({
        title: "Sucesso",
        description: "QR Code PIX gerado com sucesso!",
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar QR Code.",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl || !selectedProduct) return;

    const link = document.createElement('a');
    link.download = `pix-qr-${selectedProduct.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  const copyPixCode = async () => {
    if (!pixCode) return;

    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao copiar código PIX.",
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
          <QrCode className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-luxury font-semibold">Gerador QR Code PIX</h2>
          <p className="text-muted-foreground">
            Gere códigos PIX para seus produtos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card className="glass-effect shadow-elegant">
          <CardHeader>
            <CardTitle className="font-luxury flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent" />
              Configurar PIX
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seleção do Produto */}
            <div className="space-y-2">
              <Label htmlFor="product">Produto *</Label>
              <Select onValueChange={(value) => {
                const product = products.find(p => p.id === value) || null;
                setSelectedProduct(product);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{product.name} - {product.brand}</span>
                        <Badge variant="secondary" className="ml-2">
                          R$ {product.price.toFixed(2)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="p-3 bg-accent/5 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-accent" />
                  <span className="font-medium">Produto Selecionado</span>
                </div>
                <p className="text-sm">{selectedProduct.name} - {selectedProduct.brand}</p>
                <p className="text-lg font-bold text-accent">R$ {selectedProduct.price.toFixed(2)}</p>
              </div>
            )}

            {/* Chave PIX */}
            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave PIX *</Label>
              <Input
                id="pixKey"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, CNPJ, E-mail, Telefone ou Chave Aleatória"
              />
            </div>

            {/* Nome do Recebedor */}
            <div className="space-y-2">
              <Label htmlFor="merchantName">Nome do Recebedor *</Label>
              <Input
                id="merchantName"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="Nome ou razão social"
                maxLength={25}
              />
            </div>

            {/* Cidade */}
            <div className="space-y-2">
              <Label htmlFor="merchantCity">Cidade *</Label>
              <Input
                id="merchantCity"
                value={merchantCity}
                onChange={(e) => setMerchantCity(e.target.value)}
                placeholder="Cidade do recebedor"
                maxLength={15}
              />
            </div>

            {/* TX ID */}
            <div className="space-y-2">
              <Label htmlFor="txId">Identificador da Transação</Label>
              <Input
                id="txId"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder="Identificador único"
                maxLength={25}
              />
              <p className="text-xs text-muted-foreground">
                Gerado automaticamente baseado no produto
              </p>
            </div>

            <Button
              onClick={generateQRCode}
              className="w-full bg-gradient-luxury hover:shadow-glow"
              disabled={!selectedProduct || !pixKey || !merchantName || !merchantCity}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Gerar QR Code PIX
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card className="glass-effect shadow-elegant">
          <CardHeader>
            <CardTitle className="font-luxury flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-accent" />
              QR Code Gerado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {qrCodeDataUrl ? (
              <div className="space-y-4">
                <div className="text-center">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code PIX" 
                    className="mx-auto border rounded-lg shadow-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Código PIX</Label>
                  <div className="flex gap-2">
                    <Input
                      value={pixCode}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyPixCode}
                      className={copied ? "bg-green-50 border-green-300" : ""}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O cliente pode copiar e colar este código no app do banco
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={downloadQRCode}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>

                {selectedProduct && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm">
                      <p className="font-medium text-green-800">Informações do Pagamento</p>
                      <p className="text-green-700">Produto: {selectedProduct.name}</p>
                      <p className="text-green-700">Valor: R$ {selectedProduct.price.toFixed(2)}</p>
                      <p className="text-green-700">Recebedor: {merchantName}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Preencha os dados e clique em "Gerar QR Code PIX" para visualizar
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};