import sys

with open('src/lib/roadbook-types.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('export type RoadbookData = {', '''export type RoadbookData = {
  exibir_logo_espetaculo?: boolean;
  exibir_logo_cia?: boolean;
  exibir_logo_producao?: boolean;
  logo_producao_override?: string | null;
  logo_cia_override?: string | null;
  logo_espetaculo_override?: string | null;''')

c = c.replace('export function roadbookToPayload(d: RoadbookData) {\n  return {', '''export function roadbookToPayload(d: RoadbookData) {
  return {
    exibir_logo_espetaculo: d.exibir_logo_espetaculo ?? true,
    exibir_logo_cia: d.exibir_logo_cia ?? true,
    exibir_logo_producao: d.exibir_logo_producao ?? true,
    logo_producao_override: d.logo_producao_override || null,
    logo_cia_override: d.logo_cia_override || null,
    logo_espetaculo_override: d.logo_espetaculo_override || null,''')

c = c.replace('export function rowToRoadbook(row: any): RoadbookData {\n  return {', '''export function rowToRoadbook(row: any): RoadbookData {
  return {
    ...row,
    exibir_logo_espetaculo: row.exibir_logo_espetaculo ?? true,
    exibir_logo_cia: row.exibir_logo_cia ?? true,
    exibir_logo_producao: row.exibir_logo_producao ?? true,
    logo_producao_override: row.logo_producao_override || null,
    logo_cia_override: row.logo_cia_override || null,
    logo_espetaculo_override: row.logo_espetaculo_override || null,''')

with open('src/lib/roadbook-types.ts', 'w', encoding='utf-8') as f:
    f.write(c)
