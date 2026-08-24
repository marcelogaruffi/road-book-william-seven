import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Luggage, Weight, ShieldAlert } from "lucide-react";
import { MalaViagem } from "@/lib/roadbook-types";
import { supabase } from "@/integrations/supabase/client";

export function MalasViagemTab({ 
  malas = [], 
  onChange 
}: { 
  malas: MalaViagem[]; 
  onChange: (malas: MalaViagem[]) => void;
}) {
  const [equipe, setEquipe] = useState<{id: string, nome: string}[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('id, nome').order('nome').then(({ data }) => {
      if (data) setEquipe(data);
    });
  }, []);

  const addMala = () => {
    const newMala: MalaViagem = {
      id: crypto.randomUUID(),
      descricao: "",
      status: "pendente"
    };
    onChange([...malas, newMala]);
  };

  const updateMala = (id: string, patch: Partial<MalaViagem>) => {
    onChange(malas.map(m => m.id === id ? { ...m, ...patch } : m));
  };

  const removeMala = (id: string) => {
    onChange(malas.filter(m => m.id !== id));
  };

  return (
    <Card className="rounded-2xl border-slate-200/60 dark:border-white/10 dark:bg-card/40 backdrop-blur-xl shadow-lg">
      <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-6 mb-6">
        <CardTitle className="text-2xl font-black flex items-center gap-2">
          <Luggage className="size-6 text-primary" /> Logística de Malas e Cases
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-white/10">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Malas Pessoais e Equipamentos</h3>
            <p className="text-sm text-slate-500">Controle a franquia de bagagens despachadas e os cases de equipamentos (instrumentos, cenários, mesas de som) associando-os aos membros da equipe.</p>
          </div>
          <Button onClick={addMala} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-sm shrink-0">
            <Plus className="size-4 mr-2" /> Nova Bagagem/Case
          </Button>
        </div>

        {malas.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Luggage className="size-12 mx-auto mb-3 opacity-20" />
            <p>Nenhuma bagagem registrada para esta turnê.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {malas.map((mala) => (
              <div key={mala.id} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/50 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Descrição do Case / Mala</Label>
                      <Input 
                        value={mala.descricao} 
                        onChange={e => updateMala(mala.id, { descricao: e.target.value })} 
                        placeholder="Ex: Case Mesa DiGiCo, Mala do Ator X" 
                        className="font-medium bg-slate-50 dark:bg-slate-900/50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Responsável na Passagem</Label>
                      <Select 
                        value={mala.responsavel_id || ""} 
                        onValueChange={v => {
                          const prof = equipe.find(e => e.id === v);
                          updateMala(mala.id, { responsavel_id: v, responsavel_nome: prof?.nome || "" });
                        }}
                      >
                        <SelectTrigger className="bg-slate-50 dark:bg-slate-900/50">
                          <SelectValue placeholder="Selecione na equipe..." />
                        </SelectTrigger>
                        <SelectContent>
                          {equipe.map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1">
                        <Weight className="size-3" /> Peso Estimado / Limite
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={mala.peso || ""} 
                          onChange={e => updateMala(mala.id, { peso: e.target.value })} 
                          placeholder="Ex: 25kg" 
                          className="bg-slate-50 dark:bg-slate-900/50"
                        />
                        {(parseInt(mala.peso || "0") > 23) && (
                          <div className="flex items-center text-red-500 text-xs font-bold shrink-0" title="Acima da franquia nacional (23kg)">
                            <ShieldAlert className="size-4 mr-1" /> Excesso
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Anotações / Fragilidade</Label>
                      <Input 
                        value={mala.observacoes || ""} 
                        onChange={e => updateMala(mala.id, { observacoes: e.target.value })} 
                        placeholder="Ex: Frágil - Despachar no especial" 
                        className="bg-slate-50 dark:bg-slate-900/50"
                      />
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeMala(mala.id)} 
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 mt-6"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
