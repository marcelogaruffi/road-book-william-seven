import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Road Book William Seven" },
      { name: "description", content: "Gerencie road books de espetáculos com programação, hotel, teatro e contatos." },
      { property: "og:title", content: "Road Book William Seven" },
      { property: "og:description", content: "Gerencie road books de espetáculos com programação, hotel, teatro e contatos." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">William Seven</p>
        <h1 className="text-5xl font-semibold tracking-tight">Road Book</h1>
        <p className="text-muted-foreground text-lg">
          Organize a turnê: espetáculo, cidade, hotel, teatro, contatos e programação — tudo em uma página pública compartilhável.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button asChild size="lg">
            <Link to="/auth">Entrar</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
