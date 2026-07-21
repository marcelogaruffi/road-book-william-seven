import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, Check, ArrowRight, ShieldCheck, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const Route = createFileRoute('/verify-phone')({
  head: () => ({ meta: [{ title: 'Verificação de Celular' }] }),
  component: VerifyPhoneComponent,
});

function VerifyPhoneComponent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate({ to: '/auth', replace: true });
      return;
    }

    // Se já tiver confirmado o telefone, não precisa estar aqui
    if (session.user.phone_confirmed_at) {
      navigate({ to: '/dashboard', replace: true });
      return;
    }
    
    setLoading(false);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.warning('Digite um número de celular válido com DDD.');
      return;
    }
    
    setSending(true);
    
    // O Supabase exige formato E.164 (ex: +5511999999999)
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    formattedPhone = '+' + formattedPhone;

    const { error } = await supabase.auth.updateUser({ phone: formattedPhone });
    
    setSending(false);
    
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('unique constraint')) {
        setFormError('Este número de celular já está cadastrado em outra conta. Por favor, tente outro número.');
      } else if (msg.includes('unverified') || msg.includes('trial')) {
        setFormError('Falha no envio: O sistema de SMS está em modo de teste (Trial). Libere este número de celular no painel administrativo do Twilio para receber mensagens.');
      } else if (msg.includes('too many') || msg.includes('rate limit')) {
        setFormError('Muitas tentativas recentes. Por favor, aguarde alguns minutos antes de tentar novamente.');
      } else if (msg.includes('invalid phone')) {
        setFormError('O número de celular digitado é inválido. Verifique se o DDD e os números estão corretos.');
      } else {
        setFormError('Não foi possível enviar o SMS no momento. Verifique o número digitado e tente novamente.');
      }
    } else {
      setFormError(null);
      toast.success('Código enviado! Verifique seu SMS.');
      setStep('otp');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.warning('Digite o código de 6 dígitos.');
      return;
    }
    
    setSending(true);
    
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    formattedPhone = '+' + formattedPhone;

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'phone_change'
    });
    
    setSending(false);
    
    if (error) {
      toast.error('Código inválido ou expirado.');
    } else {
      // Sync phone to profile
      if (data?.user) {
        await supabase.from('profiles').update({ telefone: formattedPhone, telefone_verificado: true }).eq('id', data.user.id);
      }
      toast.success('Celular verificado com sucesso!');
      window.location.href = '/dashboard';
    }
  };

  async function signOut() {
    localStorage.removeItem("simulated_profile");
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="size-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden rounded-[2rem]">
        <CardHeader className="bg-gradient-to-br from-primary to-primary/80 text-white text-center py-8">
          <div className="mx-auto bg-white/20 w-16 h-16 flex items-center justify-center rounded-2xl backdrop-blur-md mb-4 shadow-inner">
            <ShieldCheck className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-black">Verificação de Segurança</CardTitle>
          <CardDescription className="text-primary-foreground/80 mt-2 font-medium">
            O administrador exige a verificação do seu número de celular para acessar a plataforma.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-slate-700 font-bold">Qual é o seu celular?</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                  <Input 
                    placeholder="(11) 99999-9999" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-14 rounded-xl text-lg bg-slate-50"
                  />
                </div>
                <p className="text-xs text-slate-500">O código será enviado por SMS.</p>
                {formError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
                    {formError}
                  </div>
                )}
              </div>
              
              <Button type="submit" disabled={sending || phone.replace(/\D/g, '').length < 10} className="w-full h-14 rounded-xl text-lg font-bold shadow-[0_8px_20px_rgba(var(--primary),0.2)]">
                {sending ? <Loader2 className="size-6 animate-spin" /> : (
                  <>Enviar Código SMS <ArrowRight className="ml-2 size-5" /></>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-slate-700 font-bold">Digite o código recebido</Label>
                <div className="relative">
                  <Check className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                  <Input 
                    placeholder="000000" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="pl-10 h-14 rounded-xl text-2xl tracking-widest text-center font-black bg-slate-50"
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={sending} className="w-full h-14 rounded-xl text-lg font-bold shadow-[0_8px_20px_rgba(var(--primary),0.2)]">
                {sending ? <Loader2 className="size-6 animate-spin" /> : 'Confirmar e Acessar'}
              </Button>
              
              <div className="text-center">
                <Button type="button" variant="link" onClick={() => setStep('phone')} className="text-slate-500">
                  Voltar e alterar o número
                </Button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center border-t pt-6">
            <Button variant="ghost" onClick={signOut} className="text-slate-400 hover:text-red-500">
              <LogOut className="size-4 mr-2" /> Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
