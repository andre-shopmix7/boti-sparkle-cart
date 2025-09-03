import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/components/auth/AuthPage";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { Card, CardContent } from "@/components/ui/card";

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuth(true);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="glass-effect shadow-elegant">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground font-elegant">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showAuth && !user) {
    return (
      <AuthPage
        onAuthSuccess={() => setShowAuth(false)}
        onBack={() => navigate("/")}
      />
    );
  }

  return (
    <AdminRoute
      fallback={
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
          <div className="text-center p-8 glass-effect rounded-lg shadow-elegant max-w-md w-full mx-4">
            <h2 className="text-2xl font-luxury font-bold mb-4">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-6">Esta área é restrita a administradores.</p>
            <button
              onClick={() => setShowAuth(true)}
              className="bg-accent text-accent-foreground px-6 py-2 rounded hover:opacity-90 mr-4"
            >
              Fazer Login
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-muted text-muted-foreground px-6 py-2 rounded hover:opacity-90"
            >
              Voltar
            </button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-subtle">
        <AdminLayout onBack={() => navigate("/")} />
      </div>
    </AdminRoute>
  );
};

export default Admin;