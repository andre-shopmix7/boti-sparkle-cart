import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, UserPlus, Trash2 } from "lucide-react";

interface UserWithRole {
  id: string;
  email: string;
  role?: 'admin' | 'customer';
  created_at: string;
}

export const UserRoleManager = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users with their roles
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;

      // Get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine user data with roles
      const usersWithRoles = usersData.users.map(user => {
        const userRole = rolesData?.find(role => role.user_id === user.id);
        return {
          id: user.id,
          email: user.email || 'N/A',
          role: userRole?.role as 'admin' | 'customer' | undefined,
          created_at: user.created_at
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const assignAdminRole = async (email: string) => {
    try {
      // First find the user by email
      const user = users.find(u => u.email === email);
      if (!user) {
        toast.error('Usuário não encontrado');
        return;
      }

      // Insert or update the role
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'admin'
        });

      if (error) throw error;

      toast.success('Permissão de administrador concedida');
      fetchUsers();
      setNewAdminEmail("");
    } catch (error: any) {
      console.error('Error assigning admin role:', error);
      toast.error('Erro ao conceder permissões de administrador');
    }
  };

  const removeAdminRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;

      toast.success('Permissões de administrador removidas');
      fetchUsers();
    } catch (error: any) {
      console.error('Error removing admin role:', error);
      toast.error('Erro ao remover permissões de administrador');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Usuários e Permissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Conceder Permissões de Administrador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="adminEmail">Email do usuário</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="usuario@exemplo.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => assignAdminRole(newAdminEmail)}
                disabled={!newAdminEmail}
              >
                Conceder Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Usuários e Permissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeAdminRole(user.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover Admin
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => assignAdminRole(user.email)}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Tornar Admin
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};