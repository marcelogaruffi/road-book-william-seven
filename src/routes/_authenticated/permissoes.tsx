import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Shield, Loader2, Check } from "lucide-react";
import { Route as AuthedRoute } from "./route";
import { usePermissions } from "@/hooks/usePermissions";

export const Route = createFileRoute("/_authenticated/permissoes")({
  head: () => ({ meta: [{ title: "Permissões Extras - Seven Produções Artísticas" }] }),
  component: PermissoesPage,
});

type Profile = {
  id: string;
  nome: string;
  role: string;
  modulos_extras: string[] | null;
};

const MODULOS = [
  { chave: "midias", nome: "Mídias Sociais" },
  { chave: "imprensa", nome: "Assessoria de Imprensa" },
  { chave: "financeiro", nome: "Financeiro" },
  { chave: "equipe", nome: "Dados da Equipe (RH)" },
  { chave: "camarins", nome: "Camarins" },
  { chave: "figurinos", nome: "Figurinos" },
  { chave: "placas", nome: "Placas de Porta" },
];

function PermissoesPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const navigate = useNavigate();
  const { isAdmin } = usePermissions(profile);

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin && profile !== null) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    if (isAdmin) loadUsers();
  }, [profile, isAdmin]);

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, role, modulos_extras")
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar usuários");
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }

  const togglePermission = async (userId: string, moduloChave: string, currentModulos: string[] | null) => {
    const modulos = currentModulos || [];
    const hasPermission = modulos.includes(moduloChave);
    
    let newModulos;
    if (hasPermission) {
      newModulos = modulos.filter(m => m !== moduloChave);
    } else {
      newModulos = [...modulos, moduloChave];
    }

    // Optimistic UI update
    setUsers(users.map(u => u.id === userId ? { ...u, modulos_extras: newModulos } : u));

    const { error } = await supabase
      .from("profiles")
      .update({ modulos_extras: newModulos })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao salvar permissão.");
      // Revert on error
      setUsers(users.map(u => u.id === userId ? { ...u, modulos_extras: modulos } : u));
    } else {
      toast.success("Permissões atualizadas com sucesso!");
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3 pb-1">
          <Shield className="size-8 text-primary" />
          Permissões Extras
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Conceda acesso a módulos específicos para membros da equipe independentemente de seus cargos oficiais.
        </p>
      </div>

      <Card className="border-0 shadow-lg dark:bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead className="font-bold">Usuário</TableHead>
                  <TableHead className="font-bold text-center">Cargo Atual</TableHead>
                  {MODULOS.map(m => (
                    <TableHead key={m.chave} className="text-center text-xs font-semibold whitespace-nowrap px-4">{m.nome}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={MODULOS.length + 2} className="h-32 text-center">
                      <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map(user => {
                    const isSuperAdmin = user.role === 'admin' || user.role === 'dev';
                    
                    return (
                      <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell className="font-medium whitespace-nowrap">{user.nome || 'Usuário Sem Nome'}</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                            {user.role || 'Sem cargo'}
                          </span>
                        </TableCell>
                        
                        {MODULOS.map(m => {
                          const hasExtra = (user.modulos_extras || []).includes(m.chave);
                          
                          // If admin, they have access naturally, so we disable the switch and show a checkmark
                          if (isSuperAdmin) {
                            return (
                              <TableCell key={m.chave} className="text-center">
                                <Check className="size-5 mx-auto text-green-500 opacity-50" />
                              </TableCell>
                            );
                          }
                          
                          return (
                            <TableCell key={m.chave} className="text-center">
                              <Switch
                                checked={hasExtra}
                                onCheckedChange={() => togglePermission(user.id, m.chave, user.modulos_extras)}
                                className="mx-auto"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
