import { Route as AuthedRoute } from "./route";
import { getErrorMessage } from "@/lib/utils";
// @ts-nocheck
import { formatPhone } from '@/lib/utils';
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Plus, UserX, UserCheck, ShieldAlert, KeyRound, Pencil, Trash2, Mail, Check, Search, ChevronDown, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplateRidersTab from "@/components/TemplateRidersTab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Suspense, lazy } from "react";
const Cropper = lazy(() => import("react-easy-crop"));
import getCroppedImg from "@/lib/cropUtils";
import { Slider } from "@/components/ui/slider";
import { ROLES_CATALOG, ROLES_BY_ID, ROLE_BADGE_MAP, getAreasTrabalho } from "@/constants/roles";

type Profile = {
  caches_padrao?: Record<string, string>;
  id: string;
  nome: string;
  funcoes?: string[];
  telefone: string | null;
  foto_url: string | null;
  email?: string | null;
  role: string;
  telefone_verificado?: boolean | null;
};

type Invite = {
  id: string;
  token: string;
  role: string;
  funcoes?: string[];
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

export const Route = createFileRoute("/_authenticated/cadastros")({
  head: () => ({ meta: [{ title: "Equipe e Convites - Áxis - Gestão de Teatros e Shows" }] }),
  component: UsersPage,
});

import { AccessDenied } from "@/components/AccessDenied";

function UsersPage() {
  // --- SEGURANÇA E CONTROLE DE ACESSO OFICIAL AXIS ---
  const routeCtx = AuthedRoute.useRouteContext ? AuthedRoute.useRouteContext() : null;
  const allowedRolesList = ["dev","admin","produtor"];
  const profileRoles = routeCtx?.profile ? [routeCtx.profile.role, ...(Array.isArray(routeCtx.profile.funcoes) ? routeCtx.profile.funcoes : [])] : [];
  const hasAccess = profileRoles.some(r => allowedRolesList.includes(r));
  if (routeCtx?.profile && !hasAccess) {
    return <AccessDenied message="Você não possui permissão para acessar esta área com o seu perfil atual." />;
  }
  // ----------------------------------------------------

  const router = useRouter();
  const { user, profile } = Route.useRouteContext();
  const isProdutor = profile?.role === 'admin' || profile?.role === 'dev' || profile?.role === 'produtor';

  const [users, setUsers] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States para o modal de edição
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editRole, setEditRole] = useState<any>("user");
  const [editFotoUrl, setEditFotoUrl] = useState<string | null>(null);
  const [editFuncoes, setEditFuncoes] = useState<string[]>([]);
  const [editCachesPadrao, setEditCachesPadrao] = useState<Record<string, string>>({});
  const [customFuncao, setCustomFuncao] = useState("");
  const [showCustomFuncaoInput, setShowCustomFuncaoInput] = useState(false);
  const [inviteGroup, setInviteGroup] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('');
  const [inviteFuncoes, setInviteFuncoes] = useState<string[]>([]);
  const [isInviteDropdownOpen, setIsInviteDropdownOpen] = useState(false);
  const [searchInviteTerm, setSearchInviteTerm] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // States para o dropdown de busca de funções
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>("");
  const [searchFuncaoTerm, setSearchFuncaoTerm] = useState("");
  const [isFuncoesDropdownOpen, setIsFuncoesDropdownOpen] = useState(false);

  // Refs para detectar cliques fora dos dropdowns e fechar automaticamente
  const editDropdownRef = useRef<HTMLDivElement>(null);
  const inviteDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target as Node)) {
        setIsFuncoesDropdownOpen(false);
      }
      if (inviteDropdownRef.current && !inviteDropdownRef.current.contains(event.target as Node)) {
        setIsInviteDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Crop states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    if (isProdutor) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, isProdutor]);

  if (profile && !isProdutor) {
    return <AccessDenied message="A página de Gestão de Equipe e Convites é exclusiva para Administradores e Produtores." />;
  }

  async function loadData() {
    setLoading(true);
    const [ { data: profilesData }, { data: invitesData } ] = await Promise.all([
      supabase.from("profiles").select("*").order("nome", { ascending: true }),
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
      toast.error("Erro ao apagar convite: " + getErrorMessage(error));
    } else {
      toast.success("Convite apagado com sucesso!");
      loadData();
    }
  }

  async function generateInvite() {
    const funcoesArray = inviteFuncoes.length > 0 ? inviteFuncoes : (inviteRole ? [inviteRole] : []);
    if (funcoesArray.length === 0) {
      toast.warning("Selecione pelo menos uma área e função para gerar o convite.");
      return;
    }
    const primaryRole = funcoesArray[0];
    const token = Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Insere com a role primária e a lista de funcoes selecionadas
    const { error } = await supabase.from("invites").insert({ 
      token, 
      role: primaryRole,
      funcoes: funcoesArray
    });

    if (error) {
      toast.error("Erro ao gerar convite: " + getErrorMessage(error));
    } else {
      toast.success("Convite gerado com sucesso com as funções selecionadas!");
      setInviteFuncoes([]);
      setInviteRole('');
      setInviteGroup('');
      loadData();
    }
  }

  async function copyToken(token: string) {
    await navigator.clipboard.writeText(token);
    toast.success("Token copiado para a área de transferência!");
  }

  function openEdit(u: Profile) {
    if (u.role === 'dev' && profile?.role !== 'dev') {
      toast.error("Administradores não podem editar o perfil Desenvolvedor.");
      return;
    }
    setEditUser(u);
    setEditNome(u.nome);
    setEditTelefone(u.telefone || "");
    setEditRole(u.role);
    setEditFotoUrl(u.foto_url);
    // Já deixa selecionadas as funções designadas + a role principal se não for dev/admin
    const existingFuncoes = Array.isArray(u.funcoes) ? [...u.funcoes] : [];
    if (u.role && !['dev', 'admin'].includes(u.role) && !existingFuncoes.includes(u.role)) {
      existingFuncoes.push(u.role);
    }
    setEditFuncoes(Array.from(new Set(existingFuncoes)));
    setEditCachesPadrao(u.caches_padrao || {});
    setSearchFuncaoTerm("");
    setIsFuncoesDropdownOpen(false);
  }

  const isGaruffi = Boolean(profile?.email?.toLowerCase().includes('garuffi') || profile?.nome?.toLowerCase().includes('garuffi') || profile?.role === 'dev');
  const areasTrabalho = useMemo(() => getAreasTrabalho(isGaruffi), [isGaruffi]);

  // Função para alternar seleção de função nos convites respeitando a regra de nível único por Área de Trabalho
  function toggleInviteRoleSelection(roleId: string) {
    const targetRole = ROLES_BY_ID[roleId];
    if (!targetRole) return;

    if (inviteFuncoes.includes(roleId)) {
      setInviteFuncoes(prev => prev.filter(id => id !== roleId));
    } else {
      setInviteFuncoes(prev => {
        const filtrado = prev.filter(id => {
          const item = ROLES_BY_ID[id];
          return item?.area !== targetRole.area;
        });
        return [...filtrado, roleId];
      });
    }
  }
  function toggleRoleSelection(roleId: string) {
    const targetRole = ROLES_BY_ID[roleId];
    if (!targetRole) return;

    if (editFuncoes.includes(roleId)) {
      // Se já está marcado, remove
      setEditFuncoes(prev => prev.filter(id => id !== roleId));
    } else {
      // Se está marcando, remove qualquer outra subfunção DA MESMA ÁREA DE TRABALHO
      // e adiciona a nova selecionada (respeitando nível único por área de trabalho)
      setEditFuncoes(prev => {
        const filtrado = prev.filter(id => {
          const item = ROLES_BY_ID[id];
          return item?.area !== targetRole.area;
        });
        return [...filtrado, roleId];
      });
    }
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
      toast.error("Erro ao enviar foto: " + getErrorMessage(err));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    
    // A role primária no banco assume a primeira função selecionada (ou mantém a atual se não houver)
    const primaryRole = editFuncoes.length > 0 ? editFuncoes[0] : (editUser.role || 'user');

    const { error } = await supabase.from("profiles").update({
      nome: editNome,
      telefone: editTelefone,
      role: editUser.role === 'dev' ? 'dev' : primaryRole,
      funcoes: editFuncoes,
      caches_padrao: editCachesPadrao,
      foto_url: editFotoUrl
    }).eq("id", editUser.id);

    if (error) {
      toast.error(getErrorMessage(error));
    } else {
      toast.success("Usuário atualizado com sucesso!");
      setEditUser(null);
      loadData();
      router.invalidate(); // Atualiza o layout pai (route.tsx) para refletir a nova foto/nome no sidebar
    }
  }

  async function deleteUser(u: Profile) {
    if (u.role === 'dev') {
      toast.error("Não é permitido excluir uma conta com perfil de Desenvolvedor.");
      return;
    }
    if (!confirm("Tem certeza que deseja remover este usuário? Ele perderá o acesso ao painel.")) return;
    const { error } = await supabase.rpc('delete_user', { user_id: u.id });
    if (error) {
      toast.error("Erro ao remover: " + getErrorMessage(error));
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

  if (profile?.role !== "dev" && profile?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <ShieldAlert className="size-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Acesso Negado</h2>
        <p className="text-slate-500 mt-2">Esta tela é restrita a Administradores e Desenvolvedores.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      
      {/* HEADER */}
      <section className="space-y-4">
        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white pb-1">
          Cadastros de Equipe & Convites
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Gerencie os membros da equipe e envie novos convites de acesso.</p>
      </section>

      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100 dark:bg-white/10 rounded-xl h-14 p-1">
          <TabsTrigger value="usuarios" className="rounded-lg h-full font-bold text-xs sm:text-sm">Usuários Cadastrados ({users.length})</TabsTrigger>
          <TabsTrigger value="convites" className="rounded-lg h-full font-bold text-xs sm:text-sm">Gerar e Ver Convites</TabsTrigger>
        </TabsList>

        {/* ABA 1: USUÁRIOS CADASTRADOS */}
        <TabsContent value="usuarios" className="mt-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-xl text-slate-800 dark:text-white">Membros da Equipe ({users.length})</h3>
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
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white truncate">{u.nome}</h4>
                        {(() => {
                          const funcs = u.funcoes && u.funcoes.length > 0 ? u.funcoes : [u.role];
                          if (['dev', 'admin', 'user'].includes(u.role) && !funcs.includes(u.role)) {
                            funcs.unshift(u.role);
                          }
                          
                          return Array.from(new Set(funcs)).map(f => {
                            if (ROLE_BADGE_MAP[f]) {
                              return <Badge key={f} className={`border-none px-2 rounded-md ${ROLE_BADGE_MAP[f].classes}`}>{ROLE_BADGE_MAP[f].label}</Badge>;
                            }
                            return <Badge key={f} className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none px-2 rounded-md capitalize">{f}</Badge>;
                          });
                        })()}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-1">
                          <Mail className="size-3.5" />
                          {u.email || "Sem e-mail"}
                        </p>
                        {u.telefone ? (
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                            {formatPhone(u.telefone) || u.telefone}
                            {u.telefone_verificado && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                                <Check className="size-3" /> Verificado
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Não verificado</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-end sm:border-l border-slate-100 dark:border-white/10 sm:pl-4 pt-4 sm:pt-0 border-t sm:border-t-0">
                    {!(u.role === 'dev' && profile?.role !== 'dev') && (
                      <>
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
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA 2: CONVITES */}
        <TabsContent value="convites" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <Card className="border-0 shadow-lg dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2rem] overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
                <CardContent className="p-8 relative z-10 space-y-6">
                  <div>
                    <h3 className="text-2xl font-black mb-2">Novo Membro</h3>
                    <p className="text-indigo-100 font-medium text-sm">Gere um token de convite seguro e envie para a pessoa criar a conta.</p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Dica amigável de múltipla escolha */}
                    <div className="bg-white/10 rounded-xl p-2.5 text-xs text-indigo-100 flex items-center gap-2 border border-white/15">
                      <Plus className="size-4 shrink-0 text-white" />
                      <span>Você pode vincular <strong>uma ou mais áreas</strong> para a mesma pessoa.</span>
                    </div>

                    {/* Dropdown 1: Área de atuação */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-indigo-100 uppercase tracking-wider block">
                        Área de atuação
                      </label>
                      <select 
                        value={inviteGroup} 
                        onChange={(e: any) => {
                          const areaEscolhida = e.target.value;
                          setInviteGroup(areaEscolhida);
                          const areaObj = areasTrabalho.find(a => a.area === areaEscolhida);
                          if (areaObj && areaObj.funcoes.length === 1) {
                            setInviteRole(areaObj.funcoes[0].id);
                          } else {
                            setInviteRole('');
                          }
                        }}
                        className="w-full h-12 rounded-xl px-4 font-semibold text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-white/20 text-sm"
                      >
                        <option value="">Selecione a Área de atuação...</option>
                        {areasTrabalho
                          .filter(a => !inviteFuncoes.some(fId => ROLES_BY_ID[fId]?.area === a.area))
                          .map(a => (
                            <option key={a.area} value={a.area}>{a.area}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dropdown 2: Função com Botão Incluir abaixo */}
                    {inviteGroup && (() => {
                      const selectedAreaObj = areasTrabalho.find(a => a.area === inviteGroup);
                      if (!selectedAreaObj) return null;
                      return (
                        <div className="space-y-2 p-3 bg-white/10 rounded-2xl border border-white/20">
                          <label className="text-xs font-bold text-white uppercase tracking-wider block">
                            Função ({inviteGroup})
                          </label>
                          <select 
                            value={inviteRole} 
                            onChange={(e: any) => setInviteRole(e.target.value)}
                            className="w-full h-11 rounded-xl px-3 font-semibold text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-white/20 text-sm"
                          >
                            <option value="">Selecione a Função...</option>
                            {selectedAreaObj.funcoes.map(sub => (
                              <option key={sub.id} value={sub.id}>
                                {sub.label} (Nível {sub.nivel})
                              </option>
                            ))}
                          </select>
                          
                          <Button
                            type="button"
                            onClick={() => {
                              if (!inviteRole) {
                                toast.warning("Selecione a função antes de adicionar.");
                                return;
                              }
                              toggleInviteRoleSelection(inviteRole);
                              setInviteRole('');
                              setInviteGroup('');
                              toast.success("Área e função adicionadas ao convite!");
                            }}
                            className="w-full h-10 bg-indigo-950/60 hover:bg-indigo-950 text-white font-bold rounded-xl border border-white/20 shadow-sm transition-colors text-xs"
                          >
                            <Plus className="size-4 mr-1.5" /> Adicionar esta função ao convite
                          </Button>
                        </div>
                      );
                    })()}

                    {/* Badges das funções acumuladas no convite */}
                    {inviteFuncoes.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-white/15">
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">
                          Funções vinculadas ao convite ({inviteFuncoes.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {inviteFuncoes.map(fId => {
                            const r = ROLES_BY_ID[fId];
                            if (!r) return null;
                            return (
                              <Badge
                                key={fId}
                                className="border-none pl-3 pr-2 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-white text-indigo-950 shadow-md"
                              >
                                <span>{r.area !== r.label ? `${r.area}: ` : ''}{r.label}</span>
                                <button
                                  type="button"
                                  onClick={() => toggleInviteRoleSelection(fId)}
                                  className="hover:bg-slate-200 rounded-full p-0.5 transition-colors text-slate-500 hover:text-slate-900"
                                  title="Remover"
                                >
                                  <X className="size-3.5" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button onClick={generateInvite} className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-bold h-12 rounded-xl shadow-lg">
                    <Plus className="mr-2 size-5" /> Gerar Convite
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-xl text-slate-800 dark:text-white px-2">Convites Pendentes</h3>
              {invites.filter(i => !i.used_at && new Date(i.expires_at) > new Date()).length === 0 ? (
                <p className="text-slate-500 text-sm px-2">Nenhum convite pendente no momento.</p>
              ) : (
                <div className="space-y-3">
                  {invites.filter(i => !i.used_at && new Date(i.expires_at) > new Date()).map(i => (
                    <Card key={i.id} className="border-0 shadow-sm bg-white dark:bg-card/40 rounded-xl overflow-hidden group">
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <KeyRound className="size-4 text-primary shrink-0" />
                            <span className="font-mono font-bold tracking-wider">{i.token}</span>
                            {(() => {
                              const funcsList = Array.isArray(i.funcoes) && i.funcoes.length > 0 
                                ? i.funcoes 
                                : [i.role];

                              return funcsList.map(rKey => (
                                ROLE_BADGE_MAP[rKey] ? (
                                  <Badge key={rKey} className={`text-xs border-none px-2 rounded-md uppercase tracking-wider ${ROLE_BADGE_MAP[rKey].classes}`}>
                                    {ROLE_BADGE_MAP[rKey].label}
                                  </Badge>
                                ) : (
                                  <Badge key={rKey} className="text-xs border-none px-2 rounded-md bg-slate-100 text-slate-700 capitalize">
                                    {rKey}
                                  </Badge>
                                )
                              ));
                            })()}
                          </div>
                          <p className="text-xs text-slate-400">Expira em: {new Date(i.expires_at).toLocaleDateString('pt-BR')}</p>
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
        </TabsContent>
      </Tabs>

      {/* MODAL DE EDIÇÃO */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="rounded-[2rem] p-8 border-0 shadow-2xl dark:bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Editar Membro</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEdit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input required value={editNome} onChange={(e) => setEditNome(e.target.value)} className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label>E-mail de Acesso (Login)</Label>
              <Input readOnly value={editUser?.email || "E-mail não registrado"} className="h-12 rounded-xl bg-slate-50 cursor-not-allowed text-slate-500" title="O e-mail de acesso não pode ser alterado por aqui" />
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
              <Input 
                value={editTelefone} 
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.length > 11) v = v.substring(0, 11);
                  if (v.length > 2) v = `(${v.substring(0,2)}) ${v.substring(2)}`;
                  if (v.length > 10) v = `${v.substring(0,10)}-${v.substring(10)}`;
                  setEditTelefone(v);
                }} 
                className="h-12 rounded-xl" 
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-slate-800 dark:text-white">Áreas de atuação e Funções</Label>
                <span className="text-xs font-semibold text-slate-500">
                  {areasTrabalho.filter(a => a.funcoes.some(f => editFuncoes.includes(f.id))).length} área(s) selecionada(s)
                </span>
              </div>

              {/* MENU DROPDOWN FECHADO / ABERTO */}
              <div className="relative" ref={editDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsFuncoesDropdownOpen(prev => !prev)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-card/40 flex items-center justify-between text-left focus:outline-none focus:ring-4 focus:ring-primary/20 hover:bg-slate-100/80 transition-all"
                >
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {editFuncoes.length === 0
                      ? "Selecione as Áreas de atuação..."
                      : `${areasTrabalho.filter(a => a.funcoes.some(f => editFuncoes.includes(f.id))).length} Área(s) marcada(s) — clique para gerenciar`}
                  </span>
                  <ChevronDown className={`size-4 text-slate-400 transition-transform ${isFuncoesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* CONTEÚDO SUSPENSO DO DROPDOWN */}
                {isFuncoesDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-2 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 max-h-80 flex flex-col space-y-2">
                    {/* Caixa de pesquisa dentro do dropdown */}
                    <div className="relative">
                      <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        autoFocus
                        value={searchFuncaoTerm}
                        onChange={(e) => setSearchFuncaoTerm(e.target.value)}
                        placeholder="Pesquisar área ou função..."
                        className="pl-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200"
                      />
                    </div>

                    {/* Lista com scroll das Áreas com Checkbox na frente + Função */}
                    <div className="overflow-y-auto max-h-60 space-y-2 pr-1">
                      {areasTrabalho.map(a => {
                        const areaChecked = a.funcoes.some(f => editFuncoes.includes(f.id));
                        const funcaoAtiva = a.funcoes.find(f => editFuncoes.includes(f.id));

                        const term = searchFuncaoTerm.toLowerCase();
                        const matchArea = a.area.toLowerCase().includes(term);
                        const matchFunc = a.funcoes.some(f => f.label.toLowerCase().includes(term) || `nível ${f.nivel}`.includes(term));
                        if (term && !matchArea && !matchFunc) return null;

                        return (
                          <div 
                            key={a.area} 
                            className={`p-2.5 rounded-xl border transition-all ${
                              areaChecked 
                                ? 'bg-primary/[0.04] border-primary/30' 
                                : 'bg-slate-50/50 dark:bg-white/5 border-slate-200/70 dark:border-white/5'
                            }`}
                          >
                            {/* Checkbox da Área */}
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={areaChecked}
                                  onChange={() => {
                                    if (areaChecked) {
                                      setEditFuncoes(prev => prev.filter(id => !a.funcoes.some(f => f.id === id)));
                                    } else {
                                      const defaultRole = a.funcoes[0];
                                      if (defaultRole) toggleRoleSelection(defaultRole.id);
                                    }
                                  }}
                                  className="size-4 rounded text-primary focus:ring-primary/30 cursor-pointer"
                                />
                                <span className={`text-sm ${areaChecked ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                  {a.area}
                                </span>
                              </label>

                              {areaChecked && funcaoAtiva && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                                  Nível {funcaoAtiva.nivel}
                                </span>
                              )}
                            </div>

                            {/* Dropdown de Função da Área Selecionada */}
                            {areaChecked && (
                              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 pl-6">
                                <select
                                  value={funcaoAtiva?.id || ''}
                                  onChange={(e) => {
                                    const novaRoleId = e.target.value;
                                    if (novaRoleId) toggleRoleSelection(novaRoleId);
                                  }}
                                  className="w-full h-9 rounded-lg px-2.5 font-medium text-xs text-slate-800 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                  {a.funcoes.map(f => (
                                    <option key={f.id} value={f.id}>
                                      {f.label} (Nível {f.nivel})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Badges das Funções Selecionadas com botão de remoção */}
              {editFuncoes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {editFuncoes.map(fId => {
                    const r = ROLES_BY_ID[fId];
                    if (!r) return null;
                    return (
                      <Badge
                        key={fId}
                        className={`border-none pl-3 pr-2 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm ${r.classes}`}
                      >
                        <span>
                          {r.area !== r.label ? `${r.area}: ` : ''}
                          {r.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleRoleSelection(fId)}
                          className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                          title="Remover função"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
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

