export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function makeRoadbookSlug(espetaculo: string, cidade: string): string {
  const s = `${slugify(espetaculo)}-${slugify(cidade)}`.replace(/^-+|-+$/g, "");
  return s || "road-book";
}

export function makeTourSlug(nome: string): string {
  return slugify(nome) || "turne";
}
