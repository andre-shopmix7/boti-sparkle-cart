import { useState } from "react";
import { AdminOrder, useAdminOrders } from "@/hooks/useAdminOrders";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Package, User, MapPin, CreditCard, FileText, Calculator } from "lucide-react";

interface OrderDetailsModalProps {
  order: AdminOrder;
  onClose: () => void;
}

export const OrderDetailsModal = ({ order, onClose }: OrderDetailsModalProps) => {
  const { updateOrderStatus, updatePaymentStatus, updateOrderNotes, calculateOrderProfit, calculateOrderProfitPercentage } = useAdminOrders();
  const [orderStatus, setOrderStatus] = useState(order.order_status);
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [notes, setNotes] = useState(order.notes || "");

  const customerName = order.guest_name || 'Cliente Convidado';
  const customerEmail = order.guest_email || 'N/A';
  const customerPhone = order.guest_phone || 'N/A';
  
  const orderProfit = calculateOrderProfit(order);
  const profitPercentage = calculateOrderProfitPercentage(order);

  const handleStatusUpdate = async () => {
    if (orderStatus !== order.order_status) {
      await updateOrderStatus(order.id, orderStatus);
    }
    if (paymentStatus !== order.payment_status) {
      await updatePaymentStatus(order.id, paymentStatus);
    }
    if (notes !== (order.notes || "")) {
      await updateOrderNotes(order.id, notes);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'processing': return 'Processando';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-luxury text-xl">
            Detalhes do Pedido #{order.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Summary */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status do Pedido</Label>
                  <Select value={orderStatus} onValueChange={setOrderStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="processing">Processando</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status do Pagamento</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Data do Pedido</Label>
                  <p className="mt-1 text-sm">
                    {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Método de Pagamento</Label>
                  <p className="mt-1 text-sm">{order.payment_method || 'N/A'}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{formatCurrency(Number(order.total_amount))}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Lucro</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(orderProfit)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">% Lucro</p>
                  <p className="text-lg font-bold">{profitPercentage.toFixed(1)}%</p>
                </div>
              </div>

              <Button onClick={handleStatusUpdate} className="w-full">
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Nome</Label>
                <p className="mt-1">{customerName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">E-mail</Label>
                <p className="mt-1">{customerEmail}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Telefone</Label>
                <p className="mt-1">{customerPhone}</p>
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço de Entrega
                </Label>
                <p className="mt-1 text-sm leading-relaxed">{order.shipping_address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="glass-effect lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Itens do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items.map((item) => {
                  const itemProfit = item.product?.profit_amount 
                    ? Number(item.product.profit_amount) * item.quantity
                    : item.product?.cost_price
                    ? (item.unit_price - Number(item.product.cost_price)) * item.quantity
                    : 0;
                  
                  const itemProfitPercentage = item.unit_price > 0 
                    ? (itemProfit / (item.unit_price * item.quantity)) * 100 
                    : 0;

                  return (
                    <div key={item.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product?.name || 'Produto não encontrado'}</h4>
                          {item.product?.brand && (
                            <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.total_price)}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity}x {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">Lucro do Item</p>
                          <p className="font-medium text-primary">{formatCurrency(itemProfit)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">% Lucro do Item</p>
                          <p className="font-medium">{itemProfitPercentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card className="glass-effect lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observações do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">Observações do pedido</Label>
                  <Textarea
                    id="notes"
                    placeholder="Adicione observações sobre este pedido..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
                
                {order.notes && (
                  <div>
                    <Label className="text-sm font-medium">Observações existentes</Label>
                    <p className="mt-1 text-sm bg-muted p-3 rounded border">
                      {order.notes}
                    </p>
                  </div>
                )}
                
                {order.pix_qr_code && (
                  <div>
                    <Label className="text-sm font-medium">QR Code PIX</Label>
                    <p className="mt-1 text-sm font-mono bg-muted p-2 rounded break-all">
                      {order.pix_qr_code}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};