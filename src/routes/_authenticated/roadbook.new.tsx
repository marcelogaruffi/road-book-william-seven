import { createFileRoute } from "@tanstack/react-router";
import { RoadbookForm, emptyRoadbook } from "@/components/RoadbookForm";

export const Route = createFileRoute("/_authenticated/roadbook/new")({
  head: () => ({ meta: [{ title: "Novo Road Book" }] }),
  component: () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Novo Road Book</h1>
      <RoadbookForm initial={emptyRoadbook} />
    </div>
  ),
});
