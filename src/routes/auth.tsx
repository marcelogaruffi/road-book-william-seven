import { maskPhone } from '@/lib/utils';
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Suspense, lazy } from "react";
const Cropper = lazy(() => import("react-easy-crop"));
import getCroppedImg from "@/lib/cropUtils";
import { toast } from "sonner";
import { Camera, Mail, Lock, User, Phone, KeyRound, UploadCloud, Sun, Moon, ArrowLeft, UserCheck, Image as ImageIcon, X } from 'lucide-react';

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Autenticação - Seven Produções Artísticas" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "update_password">("login");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Campos de Login / Recuperação
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Campos de Cadastro (Passos: 1 = Token, 2 = Form, 3 = Sucesso)
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [token, setToken] = useState("");
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  
  // States para Câmera
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Theme
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setTheme("dark");
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate({ to: "/dashboard", replace: true });
      }
    });

    // Listener para o evento de recuperação de senha (quando o usuário clica no link do email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate({ to: "/dashboard", replace: true });
      }
      if (event === "PASSWORD_RECOVERY") {
        setMode("update_password");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  };


  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowPhotoOptions(false);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setShowPhotoOptions(false);
    setShowCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error("Não foi possível acessar a câmera.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw image
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImageSrc(dataUrl);
        stopCamera();
      }
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const filename = `avatar-${Date.now()}.jpg`;
      const file = new File([croppedBlob], filename, { type: "image/jpeg" });
      setFoto(file);
      setFotoPreview(URL.createObjectURL(croppedBlob));
      setImageSrc(null); // Fecha o modal
    } catch (err) {
      toast.error("Erro ao processar imagem.");
    }
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCelular(maskPhone(e.target.value, celular));
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setErrorMsg(err.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyToken(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!token) throw new Error("Informe o token de convite.");
      
      const { data: inviteData, error: inviteError } = await supabase
        .from("invites")
        .select("*")
        .eq("token", token)
        .single();

      if (inviteError || !inviteData) {
        throw new Error("Token de convite inválido ou não encontrado.");
      }
      if (inviteData.used_at) {
        throw new Error("Este convite já foi utilizado.");
      }
      if (new Date(inviteData.expires_at) < new Date()) {
        throw new Error("Este convite expirou.");
      }

      // Token válido! Avança para o passo 2.
      toast.success("Token validado! Preencha seus dados.");
      setSignupStep(2);
      setEmail("");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignupFinal(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (password !== confirmPassword) throw new Error("As senhas não coincidem.");

      // Criar conta no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nome,
            phone: celular,
          },
        },
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("Erro ao criar conta. Tente novamente.");

      // Upload da Foto
      let fotoUrl = null;
      if (foto) {
        const fileExt = foto.name.split('.').pop();
        const filePath = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, foto);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
          fotoUrl = publicUrl;
        }
      }

      // Fetch the role from the invite
      const { data: inviteData } = await supabase
        .from("invites")
        .select("role")
        .eq("token", token)
        .single();
        
      const role = inviteData?.role || 'user';

      // Atualizar perfil com a foto e a role correta! (a trigger no banco já criou o perfil base)
      const updatePayload: any = { role: role };
      if (fotoUrl) updatePayload.foto_url = fotoUrl;
      
      await supabase.from("profiles").update(updatePayload).eq("id", user.id);

      // Marcar convite como usado no banco
      await supabase.from("invites").update({ used_at: new Date().toISOString() }).eq("token", token);

      setSignupStep(3);
      
      // Retorno automático para a tela de login após 4 segundos
      setTimeout(async () => {
        await supabase.auth.signOut();
        setMode("login");
        setSignupStep(1);
        setToken("");
        setPassword("");
        setConfirmPassword("");
      }, 4000);

    } catch (err: any) {
      if (err.message && err.message.includes("rate limit")) {
        setErrorMsg("O limite de testes do servidor (Supabase) foi atingido (Rate Limit). Aguarde 1 hora ou configure um SMTP próprio no painel para continuar testando novos cadastros.");
      } else {
        setErrorMsg(err.message || "Erro desconhecido ao cadastrar.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      if (error) throw error;
      toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      setMode("login");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (newPassword !== confirmPassword) {
        throw new Error("As senhas não coincidem.");
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Sua senha foi redefinida com sucesso!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col transition-colors duration-500 overflow-hidden relative">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 dark:bg-primary/10 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 dark:bg-purple-500/10 blur-[100px]"></div>
      </div>

      <div className="absolute top-6 right-6 z-10">
        <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full shadow-sm bg-white/50 dark:bg-card/50 backdrop-blur-md">
          {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 z-10 relative">
        <Card className="w-full max-w-lg border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/80 dark:bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-primary"></div>
          <CardContent className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <img src="/logo-seven.png" alt="William Seven" className="h-20 mx-auto object-contain mb-4" />
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-white">Gestão de Viagens e Turnês</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                {mode === "login" && "Bem-vindo de volta! Faça seu login."}
                {mode === "signup" && signupStep === 1 && "Insira o token para iniciar seu cadastro."}
                {mode === "signup" && signupStep === 2 && "Preencha seus dados para finalizar."}
                {mode === "signup" && signupStep === 3 && "Tudo pronto!"}
                {mode === "forgot" && "Recupere o acesso à sua conta."}
                {mode === "update_password" && "Crie sua nova senha de acesso."}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 border border-red-100 dark:border-red-900/30">
                ⚠️ {errorMsg}
              </div>
            )}

            {mode === "update_password" && (
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="space-y-2 relative">
                  <Label className="text-slate-700 dark:text-slate-300 ml-1">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 size-5 text-slate-400" />
                    <Input type="password" required minLength={6} className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus-visible:ring-primary" placeholder="Mínimo 6 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2 relative">
                  <Label className="text-slate-700 dark:text-slate-300 ml-1">Confirme a Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 size-5 text-slate-400" />
                    <Input type="password" required minLength={6} className={`pl-11 h-12 rounded-xl bg-slate-50 dark:bg-white/5 border focus-visible:ring-primary transition-colors ${confirmPassword && newPassword !== confirmPassword ? 'border-red-500/50 focus-visible:ring-red-500' : 'border-slate-200 dark:border-white/10'}`} placeholder="Repita a nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-red-500 text-xs font-bold ml-1 mt-1">As senhas não coincidem.</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-[0_8px_20px_rgba(var(--primary),0.2)] mt-2" disabled={loading || (!!confirmPassword && newPassword !== confirmPassword)}>
                  {loading ? "Salvando..." : "Salvar Nova Senha"}
                </Button>
              </form>
            )}

            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2 relative">
                  <Label className="text-slate-700 dark:text-slate-300 ml-1">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 size-5 text-slate-400" />
                    <Input type="email" required className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus-visible:ring-primary" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2 relative">
                  <div className="flex justify-between items-center ml-1">
                    <Label className="text-slate-700 dark:text-slate-300">Senha</Label>
                    <button type="button" onClick={() => { setMode("forgot"); setErrorMsg(null); }} className="text-sm font-bold text-primary hover:underline">Esqueceu?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 size-5 text-slate-400" />
                    <Input type="password" required className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus-visible:ring-primary" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-[0_8px_20px_rgba(var(--primary),0.2)] mt-2" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                <div className="text-center pt-4">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Tem um convite? <button type="button" onClick={() => { setMode("signup"); setSignupStep(1); setErrorMsg(null); }} className="text-primary font-bold hover:underline">Cadastre-se</button></p>
                </div>
              </form>
            )}

            {mode === "forgot" && (
              <form onSubmit={handleForgot} className="space-y-5">
                <div className="space-y-2 relative">
                  <Label className="text-slate-700 dark:text-slate-300 ml-1">E-mail cadastrado</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 size-5 text-slate-400" />
                    <Input type="email" required className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus-visible:ring-primary" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-[0_8px_20px_rgba(var(--primary),0.2)] mt-2" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Link de Recuperação"}
                </Button>
                <Button variant="ghost" type="button" onClick={() => setMode("login")} className="w-full h-12 rounded-xl font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white">
                  <ArrowLeft className="mr-2 size-4" /> Voltar ao Login
                </Button>
              </form>
            )}

            {mode === "signup" && signupStep === 1 && (
              <form onSubmit={handleVerifyToken} className="space-y-5">
                <div className="space-y-2 bg-primary/5 p-5 rounded-2xl border border-primary/20">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <KeyRound className="size-5 text-primary" />
                    <Label className="text-primary font-bold text-base">Token de Convite</Label>
                  </div>
                  <Input id="token_input" name="token_input" autoComplete="off" required className="h-12 rounded-xl bg-white dark:bg-card border-primary/30 font-mono text-center text-lg tracking-widest font-bold focus-visible:ring-primary" placeholder="Insira seu código" value={token} onChange={(e) => setToken(e.target.value.toUpperCase())} />
                </div>
                
                <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-lg mt-2" disabled={loading}>
                  {loading ? "Validando..." : "Validar Token"}
                </Button>

                <div className="text-center pt-2">
                  <Button variant="ghost" type="button" onClick={() => setMode("login")} className="font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white">
                    <ArrowLeft className="mr-2 size-4" /> Voltar ao Login
                  </Button>
                </div>
              </form>
            )}

            {mode === "signup" && signupStep === 2 && (
              <form onSubmit={handleSignupFinal} className="space-y-5">
                {/* Upload Foto */}
                <div className="flex flex-col items-center justify-center space-y-3 mb-6">
                  <div 
                    className="size-24 rounded-full border-2 border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center bg-slate-50 dark:bg-white/5 cursor-pointer hover:border-primary transition-colors overflow-hidden group relative"
                    onClick={() => setShowPhotoOptions(true)}
                  >
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="size-8 text-slate-400 group-hover:text-primary transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <UploadCloud className="text-white size-6" />
                    </div>
                  </div>
                  <Label className="text-slate-500 font-medium cursor-pointer hover:text-primary" onClick={() => setShowPhotoOptions(true)}>Adicionar Foto (Opcional)</Label>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFotoChange} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 ml-1">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 size-4 text-slate-400" />
                      <Input required className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 ml-1">Celular / WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 size-4 text-slate-400" />
                      <Input required className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10" placeholder="(11) 99999-9999" value={celular} onChange={handleCelularChange} maxLength={15} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 ml-1">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 size-4 text-slate-400" />
                    <Input type="email" required className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <Label className="text-slate-700 dark:text-slate-300 ml-1">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 size-4 text-slate-400" />
                      <Input type="password" required minLength={6} className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10" placeholder="Mínimo 6 char" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <Label className="text-slate-700 dark:text-slate-300 ml-1">Confirme</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 size-4 text-slate-400" />
                      <Input type="password" required minLength={6} className={`pl-10 h-11 rounded-xl bg-slate-50 dark:bg-white/5 border transition-colors ${confirmPassword && password !== confirmPassword ? 'border-red-500/50 focus-visible:ring-red-500' : 'border-slate-200 dark:border-white/10'}`} placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-red-500 text-xs font-bold ml-1 mt-1">As senhas não coincidem.</p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-[0_8px_20px_rgba(var(--primary),0.2)] mt-2" disabled={loading || (!!confirmPassword && password !== confirmPassword)}>
                  {loading ? "Processando..." : "Criar Conta"}
                </Button>
                
                <div className="text-center pt-2">
                  <Button variant="ghost" type="button" onClick={() => setSignupStep(1)} className="font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white">
                    <ArrowLeft className="mr-2 size-4" /> Voltar ao Token
                  </Button>
                </div>
              </form>
            )}

            {mode === "signup" && signupStep === 3 && (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto size-20 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                  <UserCheck className="size-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">Conta Criada!</h3>
                  <p className="text-slate-500 font-medium">Seu cadastro foi realizado com sucesso.</p>
                  <p className="text-slate-400 text-sm mt-4">Redirecionando para o login automaticamente...</p>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {/* Modal de Opções de Foto */}
      <Dialog open={showPhotoOptions} onOpenChange={setShowPhotoOptions}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-6 border-0 shadow-2xl dark:bg-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center">Adicionar Foto</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button variant="outline" className="h-32 flex flex-col items-center justify-center gap-3 rounded-2xl hover:bg-slate-50 hover:border-primary dark:hover:bg-white/5" onClick={startCamera}>
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="size-6 text-primary" />
              </div>
              <span className="font-bold">Tirar Foto</span>
            </Button>
            <Button variant="outline" className="h-32 flex flex-col items-center justify-center gap-3 rounded-2xl hover:bg-slate-50 hover:border-primary dark:hover:bg-white/5" onClick={() => fileInputRef.current?.click()}>
              <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ImageIcon className="size-6 text-blue-500" />
              </div>
              <span className="font-bold">Galeria</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal da Câmera (Webcam) */}
      <Dialog open={showCamera} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="sm:max-w-xl rounded-[2rem] p-6 border-0 shadow-2xl dark:bg-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center justify-between">
              Tirar Foto
              <Button variant="ghost" size="icon" onClick={stopCamera} className="rounded-full">
                <X className="size-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center mt-4">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex justify-center mt-6 pb-2">
            <button onClick={capturePhoto} className="h-20 w-20 flex-shrink-0 aspect-square p-0 rounded-full bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] border-[6px] border-red-100 dark:border-white/20 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 outline-none">
              <div className="size-12 bg-white rounded-full shadow-inner flex-shrink-0"></div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CROP */}
      <Dialog open={!!imageSrc} onOpenChange={(open) => !open && setImageSrc(null)}>
        <DialogContent className="rounded-[2rem] p-8 border-0 shadow-2xl dark:bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Ajustar Imagem</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-64 bg-slate-100 rounded-lg overflow-hidden">
            <Suspense fallback={<div className="flex items-center justify-center w-full h-full">Carregando editor...</div>}>
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
              <Button type="button" onClick={handleCropConfirm} className="flex-1 h-12 rounded-xl font-bold shadow-lg">
                Cortar e Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
