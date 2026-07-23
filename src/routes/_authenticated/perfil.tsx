// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, User, MapPin, Landmark } from "lucide-react";
import { Route as AuthedRoute } from "./route";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Meu Perfil - Seven Produções Artísticas" }] }),
  component: PerfilPage,
});

const BANCOS = [
  { codigo: "001", nome: "Banco do Brasil" },
  { codigo: "033", nome: "Santander" },
  { codigo: "104", nome: "Caixa Econômica Federal" },
  { codigo: "237", nome: "Bradesco" },
  { codigo: "341", nome: "Itaú Unibanco" },
  { codigo: "077", nome: "Banco Inter" },
  { codigo: "260", nome: "Nubank" },
  { codigo: "336", nome: "C6 Bank" },
  { codigo: "212", nome: "Banco Original" },
  { codigo: "074", nome: "Banco J. Safra" },
  // Adding 'Outro' for manual entry if needed, but a comprehensive list is better
];

function PerfilPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nome: "",
    nome_social: "",
    cpf: "",
    telefone: "",
    endereco_cep: "",
    endereco_logradouro: "",
    endereco_numero: "",
    endereco_complemento: "",
    endereco_cidade: "",
    endereco_estado: "",
    banco_codigo: "",
    banco_agencia: "",
    banco_conta: "",
    pix_tipo: "",
    pix_chave: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || "",
        nome_social: profile.nome_social || "",
        cpf: profile.cpf || "",
        telefone: profile.telefone || "",
        endereco_cep: profile.endereco_cep || "",
        endereco_logradouro: profile.endereco_logradouro || "",
        endereco_numero: profile.endereco_numero || "",
        endereco_complemento: profile.endereco_complemento || "",
        endereco_cidade: profile.endereco_cidade || "",
        endereco_estado: profile.endereco_estado || "",
        banco_codigo: profile.banco_codigo || "",
        banco_agencia: profile.banco_agencia || "",
        banco_conta: profile.banco_conta || "",
        pix_tipo: profile.pix_tipo || "",
        pix_chave: profile.pix_chave || ""
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        nome: formData.nome,
        nome_social: formData.nome_social,
        cpf: formData.cpf,
        telefone: formData.telefone,
        endereco_cep: formData.endereco_cep,
        endereco_logradouro: formData.endereco_logradouro,
        endereco_numero: formData.endereco_numero,
        endereco_complemento: formData.endereco_complemento,
        endereco_cidade: formData.endereco_cidade,
        endereco_estado: formData.endereco_estado,
        banco_codigo: formData.banco_codigo,
        banco_agencia: formData.banco_agencia,
        banco_conta: formData.banco_conta,
        pix_tipo: formData.pix_tipo,
        pix_chave: formData.pix_chave,
        updated_at: new Date().toISOString()
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Erro ao salvar perfil: " + getErrorMessage(error));
    } else {
      toast.success("Perfil atualizado com sucesso!");
    }
    setLoading(false);
  };

  // Busca CEP automático via ViaCEP
  const handleCepBlur = async () => {
    const cep = formData.endereco_cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco_logradouro: data.logradouro,
            endereco_cidade: data.localidade,
            endereco_estado: data.uf
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Meu Perfil
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Mantenha seus dados cadastrais e informações bancárias atualizadas para os pagamentos.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* DADOS PESSOAIS */}
        <Card className="shadow-sm border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="flex items-center gap-2 text-primary">
              <User className="size-5" />
              <CardTitle className="text-lg">Dados Pessoais</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input name="nome" value={formData.nome} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label>Nome Social (Opcional)</Label>
              <Input name="nome_social" value={formData.nome_social} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <Label>Telefone (WhatsApp)</Label>
              <Input name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(00) 00000-0000" />
            </div>
          </CardContent>
        </Card>

        {/* ENDEREÇO */}
        <Card className="shadow-sm border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="size-5" />
              <CardTitle className="text-lg">Endereço Residencial</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input name="endereco_cep" value={formData.endereco_cep} onChange={handleChange} onBlur={handleCepBlur} placeholder="00000-000" />
            </div>
            <div className="space-y-2">
              <Label>Rua / Logradouro</Label>
              <Input name="endereco_logradouro" value={formData.endereco_logradouro} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input name="endereco_numero" value={formData.endereco_numero} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input name="endereco_complemento" value={formData.endereco_complemento} onChange={handleChange} placeholder="Apto, Bloco, etc" />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input name="endereco_cidade" value={formData.endereco_cidade} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Estado (UF)</Label>
              <Input name="endereco_estado" value={formData.endereco_estado} onChange={handleChange} placeholder="SP" maxLength={2} />
            </div>
          </CardContent>
        </Card>

        {/* DADOS BANCÁRIOS */}
        <Card className="shadow-sm border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="flex items-center gap-2 text-primary">
              <Landmark className="size-5" />
              <CardTitle className="text-lg">Dados Bancários para Pagamento</CardTitle>
            </div>
            <CardDescription>
              Preencha com atenção. Estes dados serão usados para transferência dos cachês.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Banco</Label>
              <Select value={formData.banco_codigo || undefined} onValueChange={(val) => handleSelectChange('banco_codigo', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um banco..." />
                </SelectTrigger>
                <SelectContent>
                  {BANCOS.map(b => (
                    <SelectItem key={b.codigo} value={b.codigo}>{b.codigo} - {b.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agência (sem dígito)</Label>
              <Input name="banco_agencia" value={formData.banco_agencia} onChange={handleChange} placeholder="0000" />
            </div>
            <div className="space-y-2">
              <Label>Número da Conta (com dígito)</Label>
              <Input name="banco_conta" value={formData.banco_conta} onChange={handleChange} placeholder="00000-0" />
            </div>
            <div className="hidden sm:block"></div> {/* Spacer */}
            
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/10">
              <Label>Tipo de Chave PIX</Label>
              <Select value={formData.pix_tipo || undefined} onValueChange={(val) => handleSelectChange('pix_tipo', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="telefone">Celular</SelectItem>
                  <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/10">
              <Label>Chave PIX</Label>
              <Input name="pix_chave" value={formData.pix_chave} onChange={handleChange} placeholder="Sua chave PIX" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto font-bold rounded-xl px-8">
            {loading ? "Salvando..." : (
              <>
                <Save className="size-4 mr-2" /> Salvar Perfil
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
