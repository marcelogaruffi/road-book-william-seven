import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/som')({
  component: SomComponent,
});

function SomComponent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Som</h1>
        <p className="text-slate-500 mt-2">
          Painel de controle para equipe de Áudio
        </p>
      </div>

      <Card className="border-0 shadow-lg dark:bg-card">
        <CardHeader>
          <CardTitle>Painel de Som</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">
            Neste painel serão inseridos os mapas de palco, patch lists e necessidades técnicas de áudio.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
