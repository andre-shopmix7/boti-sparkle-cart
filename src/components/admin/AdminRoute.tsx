import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldX, User } from "lucide-react";

interface AdminRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AdminRoute = ({ children, fallback }: AdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="glass-effect shadow-elegant">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground font-elegant">Verificando permissões...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="glass-effect shadow-elegant max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-luxury font-semibold mb-4">Login Necessário</h2>
            <p className="text-muted-foreground mb-6">
              Você precisa estar logado para acessar esta página.
            </p>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Ir para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="glass-effect shadow-elegant max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <ShieldX className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-luxury font-semibold mb-4">Acesso Negado</h2>
            <p className="text-muted-foreground mb-6">
              Você não tem permissão para acessar o painel administrativo.
            </p>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};