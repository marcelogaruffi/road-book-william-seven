export interface RoleOption {
  id: string; // slug salvo no banco / profiles.role / funcoes
  label: string; // Nome limpo da função (ex: "Sound Designer", "Produtor Executivo")
  area: string; // Área de Trabalho (ex: "Som", "ContraRegragem", "Produção", etc.)
  nivel: 1 | 2 | 3 | 4; // Nível hierárquico (visto apenas na gestão)
  classes: string; // Cores do badge
  somenteGaruffi?: boolean; // Se true, restrito para Marcelo Garuffi
}

export interface AreaTrabalho {
  area: string;
  somenteGaruffi?: boolean;
  funcoes: RoleOption[];
}

export const ROLES_CATALOG: RoleOption[] = [
  // 1. Administração
  {
    id: 'admin',
    label: 'Administrador',
    area: 'Administração',
    nivel: 1,
    classes: 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300',
  },

  // 2. Camarins
  {
    id: 'camareiro_chefe',
    label: 'Camareiro(a)-Chefe',
    area: 'Camarins',
    nivel: 1,
    classes: 'bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300',
  },
  {
    id: 'camareiro',
    label: 'Camareiro(a)',
    area: 'Camarins',
    nivel: 2,
    classes: 'bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400',
  },

  // 3. Cenotécnica
  {
    id: 'cenotecnico',
    label: 'Cenotécnico',
    area: 'Cenotécnica',
    nivel: 1,
    classes: 'bg-slate-200 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200',
  },
  {
    id: 'auxiliar_cenotecnia',
    label: 'Auxiliar de Cenotécnica',
    area: 'Cenotécnica',
    nivel: 2,
    classes: 'bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300',
  },

  // 4. Contabilidade
  {
    id: 'contador',
    label: 'Contador',
    area: 'Contabilidade',
    nivel: 1,
    classes: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300',
  },

  // 5. Contrarregragem
  {
    id: 'chefe_contra_regra',
    label: 'Chefe de Contrarregragem',
    area: 'Contrarregragem',
    nivel: 1,
    classes: 'bg-stone-300 text-stone-900 hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-200',
  },
  {
    id: 'contra_regra',
    label: 'Contrarregra',
    area: 'Contrarregragem',
    nivel: 2,
    classes: 'bg-stone-200 text-stone-800 hover:bg-stone-200 dark:bg-stone-800/80 dark:text-stone-300',
  },
  {
    id: 'auxiliar_contra_regra',
    label: 'Auxiliar de Contrarregragem',
    area: 'Contrarregragem',
    nivel: 3,
    classes: 'bg-stone-100 text-stone-700 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-400',
  },

  // 6. Desenvolvimento e TI (exclusivo Marcelo Garuffi)
  {
    id: 'dev',
    label: 'Desenvolvedor',
    area: 'Desenvolvimento e TI',
    nivel: 1,
    classes: 'bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300',
    somenteGaruffi: true,
  },

  // 7. Direção Musical
  {
    id: 'diretor_musical',
    label: 'Diretor Musical',
    area: 'Direção Musical',
    nivel: 1,
    classes: 'bg-fuchsia-200 text-fuchsia-900 hover:bg-fuchsia-200 dark:bg-fuchsia-950/50 dark:text-fuchsia-300',
  },
  {
    id: 'maestro',
    label: 'Maestro',
    area: 'Direção Musical',
    nivel: 2,
    classes: 'bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-100 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
  },

  // 8. Iluminação
  {
    id: 'lighting_designer',
    label: 'Lighting Designer',
    area: 'Iluminação',
    nivel: 1,
    classes: 'bg-yellow-200 text-yellow-900 hover:bg-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300',
  },
  {
    id: 'tecnico_iluminacao',
    label: 'Técnico de Iluminação',
    area: 'Iluminação',
    nivel: 2,
    classes: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-400',
  },
  {
    id: 'operador_iluminacao',
    label: 'Operador de Iluminação',
    area: 'Iluminação',
    nivel: 3,
    classes: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-500',
  },

  // 9. Imprensa e Mídia
  {
    id: 'diretor_comunicacao',
    label: 'Diretor de Comunicação',
    area: 'Imprensa e Mídia',
    nivel: 1,
    classes: 'bg-violet-200 text-violet-900 hover:bg-violet-200 dark:bg-violet-950/50 dark:text-violet-200',
  },
  {
    id: 'assessor_imprensa',
    label: 'Assessor de Imprensa',
    area: 'Imprensa e Mídia',
    nivel: 2,
    classes: 'bg-violet-100 text-violet-800 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300',
  },
  {
    id: 'social_media',
    label: 'Social Media',
    area: 'Imprensa e Mídia',
    nivel: 2,
    classes: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    id: 'assistente_imprensa',
    label: 'Assistente de Imprensa',
    area: 'Imprensa e Mídia',
    nivel: 3,
    classes: 'bg-violet-50 text-violet-700 hover:bg-violet-50 dark:bg-violet-950/30 dark:text-violet-400',
  },
  {
    id: 'assistente_midias_sociais',
    label: 'Assistente de Mídias Sociais',
    area: 'Imprensa e Mídia',
    nivel: 3,
    classes: 'bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
  },

  // 10. Jurídico
  {
    id: 'juridico',
    label: 'Jurídico',
    area: 'Jurídico',
    nivel: 1,
    classes: 'bg-slate-200 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200',
  },

  // 11. Performers
  {
    id: 'elenco',
    label: 'Elenco',
    area: 'Performers',
    nivel: 2,
    classes: 'bg-pink-100 text-pink-700 hover:bg-pink-100 dark:bg-pink-950/40 dark:text-pink-300',
  },
  {
    id: 'pit_singer',
    label: 'Pit Singer',
    area: 'Performers',
    nivel: 2,
    classes: 'bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300',
  },
  {
    id: 'musico',
    label: 'Músico',
    area: 'Performers',
    nivel: 2,
    classes: 'bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-100 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
  },

  // 12. Produção
  {
    id: 'produtor_executivo',
    label: 'Produtor Executivo',
    area: 'Produção',
    nivel: 1,
    classes: 'bg-blue-200 text-blue-900 hover:bg-blue-200 dark:bg-blue-950/50 dark:text-blue-200',
  },
  {
    id: 'produtor',
    label: 'Produtor',
    area: 'Produção',
    nivel: 2,
    classes: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    id: 'assistente_producao',
    label: 'Assistente de Produção',
    area: 'Produção',
    nivel: 3,
    classes: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300',
  },

  // 13. Rigger
  {
    id: 'head_rigger',
    label: 'Head Rigger',
    area: 'Rigger',
    nivel: 1,
    classes: 'bg-stone-300 text-stone-900 hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-200',
  },
  {
    id: 'rigger',
    label: 'Rigger',
    area: 'Rigger',
    nivel: 2,
    classes: 'bg-stone-200 text-stone-800 hover:bg-stone-200 dark:bg-stone-800/80 dark:text-stone-300',
  },

  // 14. Roadie
  {
    id: 'backline_crew_chief',
    label: 'Backline Crew Chief',
    area: 'Roadie',
    nivel: 1,
    classes: 'bg-zinc-300 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200',
  },
  {
    id: 'tecnico_backline',
    label: 'Técnico de Backline',
    area: 'Roadie',
    nivel: 2,
    classes: 'bg-zinc-200 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300',
  },
  {
    id: 'roadie',
    label: 'Roadie',
    area: 'Roadie',
    nivel: 3,
    classes: 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400',
  },
  {
    id: 'auxiliar_backline',
    label: 'Auxiliar de Backline',
    area: 'Roadie',
    nivel: 4,
    classes: 'bg-zinc-50 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-500',
  },

  // 15. Som
  {
    id: 'sound_designer',
    label: 'Sound Designer',
    area: 'Som',
    nivel: 1,
    classes: 'bg-orange-200 text-orange-900 hover:bg-orange-200 dark:bg-orange-950/50 dark:text-orange-200',
  },
  {
    id: 'engenheiro_som_a1',
    label: 'Engenheiro de Som / A1',
    area: 'Som',
    nivel: 2,
    classes: 'bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300',
  },
  {
    id: 'tecnico_som',
    label: 'Técnico de Som / A2',
    area: 'Som',
    nivel: 3,
    classes: 'bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400',
  },
  {
    id: 'assistente_audio',
    label: 'Assistente de Áudio',
    area: 'Som',
    nivel: 4,
    classes: 'bg-orange-50 text-orange-600 hover:bg-orange-50 dark:bg-orange-950/20 dark:text-orange-500',
  },

  // 16. Stage Management
  {
    id: 'production_stage_manager',
    label: 'Production Stage Manager (PSM)',
    area: 'Stage Management',
    nivel: 1,
    classes: 'bg-indigo-200 text-indigo-900 hover:bg-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-200',
  },
  {
    id: 'stage_manager',
    label: 'Stage Manager (SM)',
    area: 'Stage Management',
    nivel: 2,
    classes: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300',
  },
  {
    id: 'assistant_stage_manager',
    label: 'Assistant Stage Manager (ASM)',
    area: 'Stage Management',
    nivel: 3,
    classes: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400',
  },

  // 17. Tour Management
  {
    id: 'tour_manager',
    label: 'Tour Manager',
    area: 'Tour Management',
    nivel: 1,
    classes: 'bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300',
  },
  {
    id: 'assistant_tour_manager',
    label: 'Assistant Tour Manager',
    area: 'Tour Management',
    nivel: 2,
    classes: 'bg-sky-50 text-sky-600 hover:bg-sky-50 dark:bg-sky-950/30 dark:text-sky-400',
  },

  // 18. Transporte
  {
    id: 'motorista',
    label: 'Motorista',
    area: 'Transporte',
    nivel: 1,
    classes: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300',
  },

  // 19. Vídeo e LED
  {
    id: 'video_designer',
    label: 'Video / Projection Designer',
    area: 'Vídeo e LED',
    nivel: 1,
    classes: 'bg-teal-200 text-teal-900 hover:bg-teal-200 dark:bg-teal-950/50 dark:text-teal-200',
  },
  {
    id: 'operador_video',
    label: 'Operador de Vídeo',
    area: 'Vídeo e LED',
    nivel: 2,
    classes: 'bg-teal-100 text-teal-800 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300',
  },
  {
    id: 'tecnico_video',
    label: 'Técnico de Vídeo',
    area: 'Vídeo e LED',
    nivel: 2,
    classes: 'bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/30 dark:text-teal-400',
  },

  // 20. Figurino
  {
    id: 'figurinista',
    label: 'Figurinista',
    area: 'Figurino',
    nivel: 1,
    classes: 'bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200',
  },
  {
    id: 'supervisor_figurino',
    label: 'Supervisor de Figurino',
    area: 'Figurino',
    nivel: 2,
    classes: 'bg-amber-50 text-amber-800 hover:bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300',
  },

  // 21. Visagismo
  {
    id: 'designer_maquiagem',
    label: 'Designer de Maquiagem',
    area: 'Visagismo',
    nivel: 1,
    classes: 'bg-rose-200 text-rose-900 hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-200',
  },
  {
    id: 'maquiador',
    label: 'Maquiador(a)',
    area: 'Visagismo',
    nivel: 2,
    classes: 'bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300',
  },

  // Legados para retrocompatibilidade
  {
    id: 'iluminador',
    label: 'Iluminador',
    area: 'Iluminação',
    nivel: 2,
    classes: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-400',
  },
  {
    id: 'assessoria_imprensa',
    label: 'Assessoria de Imprensa',
    area: 'Imprensa e Mídia',
    nivel: 2,
    classes: 'bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300',
  },
  {
    id: 'midias_sociais',
    label: 'Mídias Sociais',
    area: 'Imprensa e Mídia',
    nivel: 2,
    classes: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    id: 'user',
    label: 'Usuário Padrão',
    area: 'Geral',
    nivel: 2,
    classes: 'bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
  },
  {
    id: 'artista',
    label: 'Artista',
    area: 'Performers',
    nivel: 2,
    classes: 'bg-pink-100 text-pink-700 hover:bg-pink-100 dark:bg-pink-950/40 dark:text-pink-300',
  },
];

// Dicionário por ID para acesso rápido
export const ROLES_BY_ID: Record<string, RoleOption> = ROLES_CATALOG.reduce((acc, r) => {
  acc[r.id] = r;
  return acc;
}, {} as Record<string, RoleOption>);

// Mapa de Badges: NUNCA exibe o nível para a equipe geral, somente o nome da função!
export const ROLE_BADGE_MAP: Record<string, { label: string; classes: string }> = ROLES_CATALOG.reduce((acc, r) => {
  acc[r.id] = { label: r.label, classes: r.classes };
  return acc;
}, {} as Record<string, { label: string; classes: string }>);

// Retorna as áreas de trabalho agrupadas, filtrando se o usuário for ou não Marcelo Garuffi
export function getAreasTrabalho(isGaruffi = false): AreaTrabalho[] {
  const map = new Map<string, RoleOption[]>();
  const activeRoles = ROLES_CATALOG.filter(r => !['user', 'artista', 'iluminador', 'assessoria_imprensa', 'midias_sociais'].includes(r.id));

  for (const r of activeRoles) {
    if (r.somenteGaruffi && !isGaruffi) {
      continue;
    }
    if (!map.has(r.area)) {
      map.set(r.area, []);
    }
    map.get(r.area)!.push(r);
  }

  const list: AreaTrabalho[] = [];
  for (const [area, funcoes] of map.entries()) {
    funcoes.sort((a, b) => a.nivel - b.nivel || a.label.localeCompare(b.label, 'pt-BR'));
    list.push({ area, funcoes, somenteGaruffi: area === 'Desenvolvimento e TI' });
  }

  list.sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'));
  return list;
}
