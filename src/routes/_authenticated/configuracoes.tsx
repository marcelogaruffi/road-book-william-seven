import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Settings, ShieldCheck, Smartphone, Check, MessageSquareText } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Route as AuthedRoute } from "./route";
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/configuracoes')({
  head: () => ({ meta: [{ title: 'Configurações do Sistema' }] }),
  component: ConfiguracoesComponent,
});

function ConfiguracoesComponent() {
  const { profile } = AuthedRoute.useRouteContext();
  const navigate = useNavigate();
  const role = profile?.role || null;
  const isAdmin = role === 'admin' || role === 'dev';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exigirSms, setExigirSms] = useState(false);
  const [permitirSmsEscala, setPermitirSmsEscala] = useState(false);
  
  // Twilio Secrets
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioNumber, setTwilioNumber] = useState('');
  const [savingTwilio, setSavingTwilio] = useState(false);

  useEffect(() => {
    if (!isAdmin && profile !== null) {
      navigate({ to: '/dashboard', replace: true });
      return;
    }
    loadConfig();
  }, [profile, isAdmin]);

  const loadConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('configuracoes_sistema')
      .select('exigir_sms_cadastro, permitir_sms_escala, twilio_sid, twilio_token, twilio_number')
      .eq('id', 1)
      .single();

    if (data) {
      setExigirSms(data.exigir_sms_cadastro);
      setPermitirSmsEscala(data.permitir_sms_escala || false);
      setTwilioSid(data.twilio_sid || '');
      setTwilioToken(data.twilio_token || '');
      setTwilioNumber(data.twilio_number || '');
    } else if (error && error.code !== 'PGRST116') {
      console.error(error);
      toast.error('Erro ao carregar configurações.');
    }
    setLoading(false);
  };

  const handleToggleSms = async (checked: boolean) => {
    setExigirSms(checked);
    setSaving(true);
    const { error } = await supabase
      .from('configuracoes_sistema')
      .update({ exigir_sms_cadastro: checked })
      .eq('id', 1);

    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar configuração: ' + getErrorMessage(error));
      setExigirSms(!checked); // revert
    } else {
      toast.success(checked ? 'Verificação por SMS ativada!' : 'Verificação por SMS desativada.');
    }
  };

  const handleToggleSmsEscala = async (checked: boolean) => {
    setPermitirSmsEscala(checked);
    setSaving(true);
    const { error } = await supabase
      .from('configuracoes_sistema')
      .update({ permitir_sms_escala: checked })
      .eq('id', 1);

    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar configuração: ' + getErrorMessage(error));
      setPermitirSmsEscala(!checked); // revert
    } else {
      toast.success(checked ? 'Notificações de escala por SMS ativadas!' : 'Notificações de escala por SMS desativadas.');
    }
  };

  const handleSaveTwilio = async () => {
    setSavingTwilio(true);
    const { error } = await supabase
      .from('configuracoes_sistema')
      .update({ 
        twilio_sid: twilioSid, 
        twilio_token: twilioToken, 
        twilio_number: twilioNumber 
      })
      .eq('id', 1);

    setSavingTwilio(false);
    if (error) {
      toast.error('Erro ao salvar credenciais do Twilio: ' + getErrorMessage(error));
    } else {
      toast.success('Credenciais do Twilio salvas com sucesso!');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3 pb-1">
          <Settings className="size-8 text-slate-500" />
          Configurações do Sistema
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Ajustes globais e regras de segurança da plataforma. (Acesso exclusivo para Administradores)
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          <Card className="border-0 shadow-lg dark:bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-transparent border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-6 text-primary" />
                <div>
                  <CardTitle className="text-xl">Segurança e Autenticação</CardTitle>
                  <CardDescription>Gerencie as regras de login e acesso ao sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Smartphone className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">Exigir Verificação por SMS (Celular)</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-md">
                      Quando ativado, os usuários só poderão acessar o sistema após confirmarem o número de celular através de um código (OTP) enviado por SMS via Twilio.
                    </p>
                  </div>
                </div>
                <div className="flex items-center shrink-0">
                  <Switch 
                    checked={exigirSms} 
                    onCheckedChange={handleToggleSms} 
                    disabled={saving}
                    className="data-[state=checked]:bg-green-500 scale-125 origin-right" 
                  />
                </div>
              </div>
              
              {exigirSms && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-900/50 flex gap-3 text-amber-800 dark:text-amber-300">
                  <ShieldCheck className="size-5 shrink-0 mt-0.5" />
                  <div className="text-sm font-medium">
                    <p className="font-bold mb-1">Atenção!</p>
                    Para que o SMS seja enviado com sucesso, o provedor Twilio deve estar corretamente configurado no painel de Authentication do Supabase do seu projeto. Caso contrário, os usuários não conseguirão entrar.
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <MessageSquareText className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">Notificações de Escala via SMS</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-md">
                      Quando ativado, os administradores e produtores poderão enviar lembretes e avisos por SMS diretamente pela tela de edição de Eventos. Requer as credenciais do Twilio preenchidas abaixo.
                    </p>
                  </div>
                </div>
                <div className="flex items-center shrink-0">
                  <Switch 
                    checked={permitirSmsEscala} 
                    onCheckedChange={handleToggleSmsEscala} 
                    disabled={saving}
                    className="data-[state=checked]:bg-indigo-500 scale-125 origin-right" 
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg dark:bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden mt-6">
            <CardHeader className="pb-4 bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-transparent border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <Settings className="size-6 text-primary" />
                <div>
                  <CardTitle className="text-xl">Credenciais Avançadas (Twilio)</CardTitle>
                  <CardDescription>Necessário para enviar SMS avulsos para a equipe</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Account SID</Label>
                <Input 
                  value={twilioSid} 
                  onChange={(e) => setTwilioSid(e.target.value)} 
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                  className="bg-slate-50 dark:bg-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label>Auth Token</Label>
                <Input 
                  value={twilioToken} 
                  onChange={(e) => setTwilioToken(e.target.value)} 
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••" 
                  className="bg-slate-50 dark:bg-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label>Twilio Phone Number</Label>
                <Input 
                  value={twilioNumber} 
                  onChange={(e) => setTwilioNumber(e.target.value)} 
                  placeholder="+1234567890" 
                  className="bg-slate-50 dark:bg-slate-900"
                />
                <p className="text-xs text-slate-500 mt-1">Coloque o número oficial fornecido pelo Twilio, incluindo o código do país (ex: +1...).</p>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveTwilio} disabled={savingTwilio} className="w-full sm:w-auto h-11 px-8 rounded-xl shadow-lg">
                  {savingTwilio ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Check className="mr-2 size-5" />}
                  Salvar Credenciais
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
