import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Plus, UserX, UserCheck, ShieldAlert, KeyRound, Pencil, Trash2, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Suspense, lazy } from "react";
const Cropper = lazy(() => import("react-easy-crop"));
import getCroppedImg from "@/lib/cropUtils";
import { Slider } from "@/components/ui/slider";

type Profile = {
  id: string;
  nome: string;
  telefone: string | null;
  foto_url: string | null;
  role: "dev" | "admin" | "produtor" | "iluminador" | "motorista" | "user";
};

type Invite = {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "Equipe e Convites - Seven Produções Artísticas" }] }),
  component: UsersPage,
});

function UsersPage() {
  const router = useRouter();
  const { user, profile } = Route.useRouteContext();
  const [users, setUsers] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States para o modal de edição
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editRole, setEditRole] = useState<any>("user");
  const [editFotoUrl, setEditFotoUrl] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<'user'|'admin'|'dev'|'produtor'|'iluminador'|'motorista'>('produtor');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Crop states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    if (user.email === "marcelo.garuffi@gmail.com") {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function loadData() {
    setLoading(true);
    const [ { data: profilesData }, { data: invitesData } ] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("invites").select("*").order("created_at", { ascending: false })
    ]);
    if (profilesData) setUsers(profilesData as Profile[]);
    if (invitesData) setInvites(invitesData as Invite[]);
    setLoading(false);
  }

  async function deleteInvite(id: string) {
    if (!confirm("Tem certeza que deseja apagar este convite?")) return;
    const { error } = await supabase.rpc('delete_invite', { invite_id: id });
    if (error) {
      toast.error("Erro ao apagar convite: " + error.message);
    } else {
      toast.success("Convite apagado com sucesso!");
      loadData();
    }
  }

  async function generateInvite() {
    const token = Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const { error } = await supabase.from("invites").insert({ token, role: inviteRole });
    if (error) {
      toast.error("Erro ao gerar convite: " + error.message);
    } else {
      toast.success("Convite gerado com sucesso!");
      loadData();
    }
  }

  async function copyToken(token: string) {
    await navigator.clipboard.writeText(token);
    toast.success("Token copiado para a área de transferência!");
  }

  function openEdit(u: Profile) {
    setEditUser(u);
    setEditNome(u.nome);
    setEditTelefone(u.telefone || "");
    setEditRole(u.role);
    setEditFotoUrl(u.foto_url);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
  }

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  async function handleUploadCroppedImage() {
    if (!editUser || !imageSrc || !croppedAreaPixels) return;
    setUploadingPhoto(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const filename = `${editUser.id}-${Date.now()}.jpg`;
      const file = new File([croppedBlob], filename, { type: "image/jpeg" });
      
      const { data, error } = await supabase.storage.from("roadbook-docs").upload(`avatars/${filename}`, file, { upsert: true });
      if (error) throw error;
      
      const { data: publicData } = supabase.storage.from("roadbook-docs").getPublicUrl(`avatars/${filename}`);
      setEditFotoUrl(publicData.publicUrl);
      toast.success("Foto enviada com sucesso!");
      setImageSrc(null); // Fecha o modal de crop
    } catch (err: any) {
      toast.error("Erro ao enviar foto: " + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    
    const { error } = await supabase.from("profiles").update({
      nome: editNome,
      telefone: editTelefone,
      role: editRole,
      foto_url: editFotoUrl
    }).eq("id", editUser.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Usuário atualizado com sucesso!");
      setEditUser(null);
      loadData();
      router.invalidate(); // Atualiza o layout pai (route.tsx) para refletir a nova foto/nome no sidebar
    }
  }

  async function deleteUser(u: Profile) {
    if (u.role === 'dev') {
      toast.error("Você não pode deletar uma conta de Desenvolvedor.");
      return;
    }
    if (!confirm("Tem certeza que deseja remover este usuário? Ele perderá o acesso ao painel.")) return;
    const { error } = await supabase.rpc('delete_user', { user_id: u.id });
    if (error) {
      toast.error("Erro ao remover: " + error.message);
    } else {
      toast.success("Usuário removido da equipe.");
      loadData();
    }
  }

  // Enviar link de reset. Como não temos o e-mail na tabela profiles, teríamos que ter salvo, 
  // mas o admin não tem como disparar e-mail sem saber o e-mail.
  // Por isso, deixamos essa função apenas como um aviso ou poderíamos buscar no Auth se tivéssemos acesso.
  function warnAboutPassword() {
    toast.info("Para resetar a senha, peça para o usuário clicar em 'Esqueci a Senha' na tela de login.");
  }

  if (user.email !== "marcelo.garuffi@gmail.com") {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <ShieldAlert className="size-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Acesso Negado</h2>
        <p className="text-slate-500 mt-2">Esta tela é restrita ao Administrador Master.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      
      {/* HEADER */}
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
          Configurações do Administrador
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Gere tokens de convite e gerencie os acessos ao sistema.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: CONVITES */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2rem] overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10"></div>
            <CardContent className="p-8 relative z-10 space-y-6">
              <div>
                <h3 className="text-2xl font-black mb-2">Novo Membro</h3>
                <p className="text-indigo-100 font-medium text-sm">Gere um token de convite seguro e envie para a pessoa criar a conta.</p>
              </div>
              
              <div className="space-y-2">
                <select 
                  value={inviteRole} 
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="w-full h-12 rounded-xl px-4 font-semibold text-slate-800 bg-white/90 focus:outline-none focus:ring-4 focus:ring-white/20"
                >
                  <option value="admin">Administrador (Prod. Executiva)</option>
                  <option value="produtor">Produtor</option>
                  <option value="iluminador">Iluminador</option>
                  <option value="motorista">Motorista</option>
                  <option value="user">Usuário Padrão</option>
                </select>
              </div>

              <Button onClick={generateInvite} className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-bold h-12 rounded-xl shadow-lg">
                <Plus className="mr-2 size-5" /> Gerar Convite
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white px-2">Convites Pendentes</h3>
            {invites.filter(i => !i.used_at).length === 0 ? (
              <p className="text-slate-500 text-sm px-2">Nenhum convite pendente no momento.</p>
            ) : (
              <div className="space-y-3">
                {invites.filter(i => !i.used_at).map(i => (
                  <Card key={i.id} className="border-0 shadow-sm bg-white dark:bg-card/40 rounded-xl overflow-hidden group">
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <KeyRound className="size-4 text-primary" />
                          <span className="font-mono font-bold tracking-wider">{i.token}</span>
                          {i.role && <Badge variant="outline" className="ml-2 text-xs">{i.role.toUpperCase()}</Badge>}
                        </div>
                        <p className="text-xs text-slate-400">Expira em: {new Date(i.expires_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => copyToken(i.token)} className="rounded-full text-slate-400 hover:text-primary hover:bg-primary/10" title="Copiar Token">
                          <Copy className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteInvite(i.id)} className="rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50" title="Apagar Convite">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: USUÁRIOS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-xl text-slate-800 dark:text-white">Usuários Cadastrados ({users.length})</h3>
          </div>

          {loading ? (
             <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : (
            <div className="grid gap-4">
              {users.map(u => (
                <Card key={u.id} className="border-0 shadow-[0_2px_15px_rgb(0,0,0,0.03)] dark:shadow-[0_2px_15px_rgb(0,0,0,0.2)] bg-white dark:bg-card/40 dark:backdrop-blur-md rounded-2xl flex flex-col sm:flex-row sm:items-center p-4 gap-5">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="size-14 rounded-2xl border-2 border-slate-100 dark:border-white/10 shadow-sm shrink-0">
                      <AvatarImage src={u.foto_url || undefined} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-white font-bold rounded-2xl text-lg">
                        {u.nome[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white truncate">{u.nome}</h4>
                        {u.role === "dev" && <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none px-2 rounded-md">Desenvolvedor</Badge>}
                        {u.role === "admin" && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2 rounded-md">Master Admin</Badge>}
                        {u.role === "produtor" && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-2 rounded-md">Produtor</Badge>}
                        {u.role === "iluminador" && <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none px-2 rounded-md">Iluminador</Badge>}
                        {u.role === "motorista" && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2 rounded-md">Motorista</Badge>}
                        {u.role === "user" && <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none px-2 rounded-md">Usuário Padrão</Badge>}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">{u.telefone || "Sem telefone"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-end sm:border-l border-slate-100 dark:border-white/10 sm:pl-4 pt-4 sm:pt-0 border-t sm:border-t-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)} className="rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={warnAboutPassword} className="rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10" title="Resetar Senha">
                      <Mail className="size-4" />
                    </Button>
                    {u.id !== profile?.id && (
                      <Button variant="ghost" size="icon" onClick={() => deleteUser(u)} className="rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="rounded-[2rem] p-8 border-0 shadow-2xl dark:bg-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Editar Membro</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEdit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input required value={editNome} onChange={(e) => setEditNome(e.target.value)} className="h-12 rounded-xl" />
            </div>
            
            <div className="space-y-2">
              <Label>Foto de Perfil (Avatar)</Label>
              <div className="flex items-center gap-4">
                <Avatar className="size-16 rounded-2xl border-2 border-slate-100 dark:border-white/10 shadow-sm shrink-0">
                  <AvatarImage src={editFotoUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-white font-bold rounded-2xl text-xl">
                    {editNome ? editNome[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileSelect}
                    disabled={uploadingPhoto}
                    className="h-11 cursor-pointer pt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">{uploadingPhoto ? "Processando foto..." : "Selecione uma imagem para ajustar e cortar."}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Telefone / WhatsApp</Label>
              <Input value={editTelefone} onChange={(e) => setEditTelefone(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Nível de Acesso</Label>
              {editUser?.role === 'dev' || editUser?.nome?.toLowerCase().includes('garuffi') ? (
                <div className="p-4 bg-slate-100 rounded-xl font-bold text-slate-500 border border-slate-200">
                  🔒 O nível do Desenvolvedor não pode ser modificado.
                </div>
              ) : (
                <select 
                  value={editRole} 
                  onChange={(e: any) => setEditRole(e.target.value)}
                  className="w-full h-12 rounded-xl px-4 font-semibold text-slate-800 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/20"
                >
                  <option value="admin">Administrador (Prod. Executiva)</option>
                  <option value="produtor">Produtor</option>
                  <option value="iluminador">Iluminador</option>
                  <option value="motorista">Motorista</option>
                  <option value="user">Usuário Padrão</option>
                </select>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditUser(null)} className="flex-1 h-12 rounded-xl font-bold">Cancelar</Button>
              <Button type="submit" className="flex-1 h-12 rounded-xl font-bold shadow-lg">Salvar Alterações</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CROP */}
      <Dialog open={!!imageSrc} onOpenChange={(open) => !open && setImageSrc(null)}>
        <DialogContent className="rounded-[2rem] p-8 border-0 shadow-2xl dark:bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Ajustar Imagem</DialogTitle>
          </DialogHeader>
          <div className="relative h-64 w-full bg-slate-900 rounded-2xl overflow-hidden mt-4">
            {imageSrc && (
              <Suspense fallback={<div className="flex items-center justify-center w-full h-full text-white">Carregando editor...</div>}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </Suspense>
            )}
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <Label className="mb-2 block">Zoom</Label>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(v) => setZoom(v[0])}
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setImageSrc(null)} className="flex-1 h-12 rounded-xl font-bold">Cancelar</Button>
              <Button onClick={handleUploadCroppedImage} disabled={uploadingPhoto} className="flex-1 h-12 rounded-xl font-bold shadow-lg">
                {uploadingPhoto ? "Salvando..." : "Cortar e Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
