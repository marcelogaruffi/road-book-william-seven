import { useMemo } from 'react';

type Profile = {
  id?: string;
  role?: string | null;
  modulos_extras?: string[] | null;
  [key: string]: any;
};

export function usePermissions(profile: Profile | null | undefined) {
  return useMemo(() => {
    const role = profile?.role || null;
    const modulos = profile?.modulos_extras || [];

    const isAdmin = role === 'admin' || role === 'dev';
    
    // Admin tem acesso a tudo sempre
    const checkAccess = (rolesPermitidas: string[], moduloChave: string) => {
      if (isAdmin) return true;
      if (role && rolesPermitidas.includes(role)) return true;
      if (modulos.includes(moduloChave)) return true;
      return false;
    };

    return {
      isAdmin,
      
      // Comunicação
      canAccessMidias: checkAccess(['produtor', 'midias_sociais'], 'midias'),
      canAccessImprensa: checkAccess(['produtor', 'assessoria_imprensa'], 'imprensa'),
      
      // Financeiro
      canAccessFinanceiro: checkAccess(['produtor', 'financeiro'], 'financeiro'),
      
      // RH / Equipe
      canAccessDadosEquipe: checkAccess(['produtor', 'rh', 'assistente_producao', 'tour_manager'], 'equipe'),
      
      // Camarins / Produção Local
      canAccessCamarins: checkAccess(['produtor', 'producao_local', 'camareiro', 'assistente_producao'], 'camarins'),
      
      // Placas de Porta
      canAccessPlacas: checkAccess(['produtor', 'producao_local', 'assistente_producao'], 'placas'),
      
      // Figurinos
      canAccessFigurinos: checkAccess(['produtor', 'camareiro', 'elenco'], 'figurinos'),

      // Outros módulos que podem ser úteis
      canAccessVendas: checkAccess(['produtor', 'merch', 'financeiro'], 'vendas'),
    };
  }, [profile]);
}
