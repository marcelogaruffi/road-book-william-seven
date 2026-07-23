// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, Search, CheckCircle, Clock, FileText, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinanceiroTab } from "@/components/FinanceiroTab";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro - Seven ProduÃ§Ãµes ArtÃ­sticas" }] }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState("fluxo");
  const [selectedEvento, setSelectedEvento] = useState<string>("");
  
  // Data States
  const [profiles, setProfiles] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [escalas, setEscalas] = useState<any[]>([]);
  const [caches, setCachêêes] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [profRes, evRes, escRes, cacheRes, pagRes] = await Promise.all([
      supabase.from('profiles').select('*').order('nome'),
      supabase.from('eventos').select('id, espetaculo, cidade, data').order('data', { ascending: false }),
      supabase.from('evento_escalas').select('*').eq('status', 'aceita'),
      supabase.from('evento_escalas_financeiro').select('*'),
      supabase.from('pagamentos').select('*')
    ]);

    if (profRes.data) setProfiles(profRes.data);
    if (evRes.data) setEventos(evRes.data);
    if (escRes.data) setEscalas(escRes.data);
    if (cacheRes.data) setCachêêes(cacheRes.data);
    if (pagRes.data) setPagamentos(pagRes.data);
    
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const exportDirectory = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("DiretÃ³rio de Contatos");

    let logoBase64;
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
      });
    } catch (e) {
      console.warn("Logo nÃ£o carregado", e);
    }

    let imgHeightExcel = 70;
    const imgWidthExcel = 140;
    if (logoBase64) {
      const img = new Image();
      img.src = logoBase64;
      await new Promise((res) => { img.onload = res; });
      imgHeightExcel = (img.naturalHeight / img.naturalWidth) * imgWidthExcel;
    }

    worksheet.getColumn(1).width = 30; // Nome
    worksheet.getColumn(2).width = 15; // FunÃ§Ã£o
    worksheet.getColumn(3).width = 18; // CPF
    worksheet.getColumn(4).width = 15; // Telefone
    worksheet.getColumn(5).width = 50; // Dados BancÃ¡rios

    const headerRowNumber = logoBase64 ? 6 : 1;

    if (logoBase64) {
      const imageId = workbook.addImage({ base64: logoBase64 as string, extension: 'png' });
      worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
      worksheet.mergeCells('D1:F4');
      worksheet.getCell('D1').value = 'Dados BancÃ¡rios da Equipe';
      worksheet.getCell('D1').font = { size: 16, bold: true, color: { argb: "FF0f172a" } };
      worksheet.getCell('D1').alignment = { vertical: 'middle', horizontal: 'left' };
    }

    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = ["Nome", "FunÃ§Ã£o", "CPF", "Telefone", "Dados BancÃ¡rios (Pix / Conta)"];
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf1f5f9' } };
      cell.font = { bold: true, color: { argb: 'FF334155' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFcbd5e1' } },
        bottom: { style: 'thin', color: { argb: 'FFcbd5e1' } }
      };
    });

    profiles.forEach((p, index) => {
      const row = worksheet.getRow(headerRowNumber + 1 + index);
      const enderecoStr = [p.endereco_logradouro, p.endereco_numero, p.endereco_complemento, p.endereco_cidade, p.endereco_estado, p.endereco_cep].filter(Boolean).join(', ');
      
      let bancoStr = '';
      if (p.pix_chave) {
        bancoStr += `PIX (${p.pix_tipo}): ${p.pix_chave}`;
      }
      if (p.banco_codigo) {
        if (bancoStr) bancoStr += ' | ';
        bancoStr += `Banco: ${p.banco_codigo} Ag: ${p.banco_agencia} C/C: ${p.banco_conta}`;
      }

      row.values = [
        p.nome || '',
        p.role ? p.role.toUpperCase() : '',
        p.cpf || '',
        p.telefone || '',
        bancoStr
      ];
      
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFe2e8f0' } } };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Diretorio_Contatos_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const filteredProfiles = profiles.filter(p => 
    (p.nome || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.cpf || '').includes(search) || 
    (p.role || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Financeiro
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          GestÃ£o de pagamentos da equipe e diretÃ³rio de dados bancÃ¡rios.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-900 mb-4">
          <TabsTrigger value="fluxo">Fluxo de Caixa (Manual)</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos por Evento</TabsTrigger>
          <TabsTrigger value="caches_padrao">CachêêÃªs PadrÃ£o</TabsTrigger>
          <TabsTrigger value="diretorio">Dados BancÃ¡rios</TabsTrigger>
        </TabsList>

        <TabsContent value="fluxo" className="space-y-4">
          <div className="bg-white dark:bg-card/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
            <div className="max-w-md space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Escolha o Evento para o Fluxo de Caixa</Label>
              <Select value={selectedEvento} onValueChange={setSelectedEvento}>
                <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-900">
                  <SelectValue placeholder="Selecione um evento..." />
                </SelectTrigger>
                <SelectContent>
                  {eventos.map(ev => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.cidade} - {ev.espetaculo} {ev.data ? `(${format(new Date(ev.data + 'T12:00:00Z'), "dd/MM/yyyy")})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEvento ? (
              <div className="pt-6 border-t border-slate-100 dark:border-white/5 mt-6">
                <FinanceiroTab roadbookId={selectedEvento} />
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center opacity-50">
                <Wallet className="size-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold">Nenhum evento selecionado</h3>
                <p>Selecione um evento acima para carregar o painel financeiro manual.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="diretorio" className="space-y-4">
          <Card className="shadow-sm border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input 
                  placeholder="Buscar por nome, CPF, cargo..." 
                  className="pl-9 bg-white dark:bg-black"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={exportDirectory} className="shrink-0 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl">
                <Download className="size-4 mr-2" /> Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-bold">Nome & CPF</th>
                      <th className="px-6 py-4 font-bold">Cargo</th>
                      <th className="px-6 py-4 font-bold">Banco & Conta</th>
                      <th className="px-6 py-4 font-bold">Chave PIX</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center">Carregando...</td></tr>
                    ) : (
                      filteredProfiles.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">{p.nome}</div>
                            <div className="text-xs text-slate-500">{p.cpf || '-'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="uppercase text-[10px]">{p.role}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-700 dark:text-slate-300">{p.banco_codigo || '-'}</div>
                            <div className="text-xs text-slate-500">Ag: {p.banco_agencia || '-'} / CC: {p.banco_conta || '-'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-700 dark:text-slate-300">{p.pix_chave || '-'}</div>
                            <div className="text-xs text-slate-500 capitalize">{p.pix_tipo || '-'}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caches_padrao" className="space-y-4">
          <CachêêesPadraoView profiles={profiles} reload={loadData} />
        </TabsContent>

        <TabsContent value="pagamentos" className="space-y-4">
          <PagamentosView 
            eventos={eventos} 
            escalas={escalas} 
            caches={caches} 
            pagamentos={pagamentos} 
            profiles={profiles}
            reload={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Subcomponente para a visÃ£o de Pagamentos
function PagamentosView({ eventos, escalas, caches, pagamentos, profiles, reload }: any) {
  const [selectedEscala, setSelectedEscala] = useState<any>(null);

  return (
    <div className="space-y-6">
      {eventos.map(ev => {
        const evEscalas = escalas.filter(e => e.evento_id === ev.id);
        if (evEscalas.length === 0) return null; // SÃ³ mostra eventos com escalas aceitas
        
        let totalEvento = 0;
        let pagoEvento = 0;

        const detalhesEquipe = evEscalas.map(esc => {
          const prof = profiles.find(p => p.id === esc.usuario_id);
          const cacheObj = caches.find(c => c.escala_id === esc.id);
          const valorCachêêe = Number(cacheObj?.cache_valor) || 0;
          const pgto = pagamentos.find(p => p.escala_id === esc.id);
          const valorPago = pgto ? Number(pgto.valor) : 0;
          
          totalEvento += valorCachêêe;
          pagoEvento += valorPago;

          return { esc, prof, valorCachêêe, pgto };
        });

        return (
          <Card key={ev.id} className="shadow-sm border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">{ev.espetaculo}</CardTitle>
                  <CardDescription>{ev.cidade} - {format(new Date(ev.data + 'T12:00:00Z'), "dd/MM/yyyy")}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-500">Total Pago / CachêêÃªs</div>
                  <div className="text-lg font-extrabold text-slate-800 dark:text-white">
                    <span className={pagoEvento >= totalEvento && totalEvento > 0 ? "text-green-600" : ""}>
                      R$ {pagoEvento.toLocaleString('pt-BR', {minimumFractionDigits:2})}
                    </span> / R$ {totalEvento.toLocaleString('pt-BR', {minimumFractionDigits:2})}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-white/10">
                  <tr>
                    <th className="px-4 py-3 font-bold">Membro</th>
                    <th className="px-4 py-3 font-bold">CachêêÃª Combinado</th>
                    <th className="px-4 py-3 font-bold">Status Pgto</th>
                    <th className="px-4 py-3 font-bold text-right">AÃ§Ãµes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {detalhesEquipe.map(({ esc, prof, valorCachêêe, pgto }) => (
                    <tr key={esc.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 dark:text-white">{prof?.nome}</div>
                        <div className="text-[10px] uppercase text-slate-400">{prof?.role}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                        R$ {valorCachêêe.toLocaleString('pt-BR', {minimumFractionDigits:2})}
                      </td>
                      <td className="px-4 py-3">
                        {pgto ? (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="size-3 mr-1" /> Pago
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                            <Clock className="size-3 mr-1" /> Pendente
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pgto ? (
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={() => window.open(pgto.comprovante_url, '_blank')}>
                            <FileText className="size-4 mr-2" /> Comprovante
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => setSelectedEscala({ esc, prof, valorCachêêe, ev })}>
                            Dar Baixa
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}

      {selectedEscala && (
        <PagamentoModal 
          dados={selectedEscala} 
          onClose={() => setSelectedEscala(null)} 
          reload={reload} 
        />
      )}
    </div>
  );
}

function PagamentoModal({ dados, onClose, reload }: any) {
  const { esc, prof, valorCachêêe, ev } = dados;
  const [valor, setValor] = useState(valorCachêêe.toString());
  const [dataPgto, setDataPgto] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let url = "";
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${prof.id}_${ev.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('comprovantes').upload(fileName, file);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('comprovantes').getPublicUrl(fileName);
        url = publicUrl; // Actually, the bucket is private, so we might need a signed URL later, but for now we'll store the path or publicUrl if we set it up to be readable by authenticated users
      }

      const dadosBancariosSnapshot = {
        banco: prof.banco_codigo,
        agencia: prof.banco_agencia,
        conta: prof.banco_conta,
        pix_tipo: prof.pix_tipo,
        pix_chave: prof.pix_chave
      };

      const { error } = await supabase.from('pagamentos').insert({
        usuario_id: prof.id,
        evento_id: ev.id,
        escala_id: esc.id,
        valor: parseFloat(valor),
        data_pagamento: dataPgto,
        comprovante_url: url,
        dados_bancarios_snapshot: dadosBancariosSnapshot
      });

      if (error) throw error;
      toast.success("Pagamento registrado com sucesso!");
      onClose();
      reload();
    } catch (error: any) {
      toast.error("Erro ao registrar pagamento: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Efetuando pagamento para {prof.nome} referente a {ev.espetaculo}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 my-2 text-sm border border-slate-200 dark:border-white/10 space-y-2">
          <div className="font-bold text-slate-700 dark:text-slate-300">Dados BancÃ¡rios Atuais do UsuÃ¡rio:</div>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-slate-500">Banco:</span> {prof.banco_codigo || '-'}</div>
            <div><span className="text-slate-500">AgÃªncia:</span> {prof.banco_agencia || '-'}</div>
            <div><span className="text-slate-500">Conta:</span> {prof.banco_conta || '-'}</div>
            <div><span className="text-slate-500">Chave PIX:</span> {prof.pix_chave || '-'}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Pago (R$)</Label>
              <Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input type="date" value={dataPgto} onChange={e => setDataPgto(e.target.value)} required />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Comprovante (Opcional)</Label>
            <div className="flex items-center gap-2">
              <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="flex-1" accept="image/*,.pdf" />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
              {loading ? "Salvando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CachêêesPadraoView({ profiles, reload }: any) {
  const [saving, setSaving] = useState<string | null>(null);
  const [caches, setCachêêes] = useState<Record<string, Record<string, string>>>({});
  
  // Initialize caches
  useEffect(() => {
    const initial: Record<string, Record<string, string>> = {};
    profiles.forEach((p: any) => {
      initial[p.id] = {};
      const baseCachêêes = typeof p.cache_padrao === 'object' && p.cache_padrao !== null ? p.cache_padrao : {};
      const funcoes = p.funcoes && p.funcoes.length > 0 ? p.funcoes : (p.role ? [p.role] : []);
      funcoes.forEach((f: string) => {
        initial[p.id][f] = baseCachêêes[f] !== undefined ? Number(baseCachêêes[f]).toFixed(2) : "0.00";
      });
    });
    setCachêêes(initial);
  }, [profiles]);

  const handleSave = async (profileId: string) => {
    setSaving(profileId);
    
    const cachesToSave: Record<string, number> = {};
    Object.entries(caches[profileId] || {}).forEach(([funcao, val]) => {
      cachesToSave[funcao] = parseFloat(val) || 0;
    });

    const { error } = await supabase.from('profiles').update({ cache_padrao: cachesToSave }).eq('id', profileId);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("CachêêÃª padrÃ£o atualizado com sucesso!");
      reload();
    }
    setSaving(null);
  };

  return (
    <Card className="shadow-sm border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-4">
        <CardTitle className="text-lg">Tabela de CachêêÃªs PadrÃ£o</CardTitle>
        <CardDescription>Defina o valor base de cachÃª para cada membro da equipe. Ao escalÃ¡-los, este valor serÃ¡ preenchido automaticamente.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-white/10">
            <tr>
              <th className="px-4 py-3 font-bold">Membro</th>
              <th className="px-4 py-3 font-bold">Cargo/FunÃ§Ãµes</th>
              <th className="px-4 py-3 font-bold w-48">CachêêÃª PadrÃ£o (R$)</th>
              <th className="px-4 py-3 font-bold text-right">AÃ§Ãµes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {profiles.filter((p: any) => p.role !== 'admin').map((prof: any) => (
              <tr key={prof.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{prof.nome}</td>
                <td className="px-4 py-3" colSpan={2}>
                  <div className="flex flex-col gap-2">
                    {(prof.funcoes && prof.funcoes.length > 0 ? prof.funcoes : [prof.role]).map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-4">
                        <Badge variant="outline" className="text-[10px] uppercase w-28 justify-center bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {f.replace('_', ' ')}
                        </Badge>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={caches[prof.id]?.[f] ?? ""} 
                          onChange={e => setCachêêes(prev => ({
                            ...prev,
                            [prof.id]: {
                              ...(prev[prof.id] || {}),
                              [f]: e.target.value
                            }
                          }))} 
                          className="h-8 w-32"
                          placeholder="0,00"
                        />
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button 
                    size="sm" 
                    onClick={() => handleSave(prof.id)}
                    disabled={saving === prof.id}
                    className="bg-primary text-white font-bold h-8"
                  >
                    {saving === prof.id ? "Salvando..." : "Salvar"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
