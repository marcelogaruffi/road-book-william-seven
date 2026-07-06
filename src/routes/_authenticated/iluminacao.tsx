import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/iluminacao')({
  component: IluminacaoComponent,
});

function IluminacaoComponent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Iluminação</h1>
        <p className="text-slate-500 mt-2">
          Painel de controle para equipe de Luz
        </p>
      </div>

      <Card className="border-0 shadow-lg dark:bg-card">
        <CardHeader>
          <CardTitle>Painel de Iluminação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">
            Neste painel serão inseridos os controles, mapas de luz e configurações de mapa do espetáculo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
