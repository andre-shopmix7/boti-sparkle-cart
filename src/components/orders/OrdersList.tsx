import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { 
  Package, 
  Calendar,
  CreditCard,
  MapPin,
  Eye,
  ShoppingBag
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrdersListProps {
  onViewOrder?: (orderId: string) => void;
}

export const OrdersList = ({ onViewOrder }: OrdersListProps) => {
  const { orders, loading } = useOrders();
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'shipped':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card className="glass-effect shadow-elegant">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando pedidos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="glass-effect shadow-elegant">
        <CardContent className="py-12">
          <div className="text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-luxury font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground">
              {user ? "Você ainda não fez nenhum pedido." : "Faça login para ver seus pedidos ou continue navegando como convidado."}
            </p>
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
          <h2 className="text-2xl font-luxury font-semibold">Meus Pedidos</h2>
          <p className="text-muted-foreground">
            {orders.length} pedido{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="glass-effect shadow-elegant hover:shadow-luxury transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="font-luxury text-lg">
                    Pedido #{order.id.slice(0, 8)}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(order.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-luxury font-bold text-accent">
                    {formatCurrency(order.total_amount)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={getStatusColor(order.order_status)}>
                      {order.order_status}
                    </Badge>
                    <Badge variant={getPaymentStatusColor(order.payment_status)}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Payment Method */}
                {order.payment_method && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Pagamento: {order.payment_method}
                    </span>
                  </div>
                )}

                {/* Shipping Address */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Endereço de entrega:</p>
                    <p className="text-muted-foreground">{order.shipping_address}</p>
                  </div>
                </div>

                {/* Guest Information */}
                {!user && order.guest_email && (
                  <>
                    <Separator />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Informações do pedido:</p>
                      <p className="text-muted-foreground">Email: {order.guest_email}</p>
                      {order.guest_name && (
                        <p className="text-muted-foreground">Nome: {order.guest_name}</p>
                      )}
                      {order.guest_phone && (
                        <p className="text-muted-foreground">Telefone: {order.guest_phone}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Order Items Preview */}
                {(order as any).order_items && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium text-sm mb-2">
                        Itens ({(order as any).order_items.length}):
                      </p>
                      <div className="space-y-1">
                        {(order as any).order_items.slice(0, 3).map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">
                              {item.quantity}x {item.products?.name || `Produto ${item.product_id.slice(0, 8)}`}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(item.total_price)}
                            </span>
                          </div>
                        ))}
                        {(order as any).order_items.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{(order as any).order_items.length - 3} mais...
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewOrder?.(order.id)}
                    className="border-accent text-accent hover:bg-accent hover:text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};