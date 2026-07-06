import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/eventos')({
  component: EventosComponent,
});

function EventosComponent() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();
        if (profile) setRole(profile.role);
      }
    })();
  }, []);

  const canEdit = ['dev', 'admin', 'produtor'].includes(role || '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Eventos</h1>
        <p className="text-slate-500 mt-2">
          Gestão de Eventos e Espetáculos
        </p>
      </div>

      <Card className="border-0 shadow-lg dark:bg-card">
        <CardHeader>
          <CardTitle>Painel de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">
            {canEdit ? "Você tem permissão para cadastrar e editar os eventos." : "Você tem permissão de leitura para visualizar os eventos."}
          </p>
          {/* Tabela de eventos entrará aqui no futuro */}
        </CardContent>
      </Card>
    </div>
  );
}
