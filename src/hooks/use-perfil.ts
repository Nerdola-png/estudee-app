import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import type { TablesUpdate } from '@/types/database';

const municipiosSchema = z.array(z.object({
  id: z.number().int(),
  nome: z.string(),
}));

export type MunicipioIBGE = z.infer<typeof municipiosSchema>[number];

type PerfilUpdate = Pick<
  TablesUpdate<'profiles'>,
  'nickname' | 'ranking_opt_in' | 'uf' | 'municipio_ibge' | 'cidade' | 'estado'
>;

export function useMunicipiosIBGE(uf: string) {
  return useQuery({
    queryKey: ['municipios-ibge', uf],
    enabled: /^[A-Z]{2}$/.test(uf),
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(uf)}/municipios?orderBy=nome`,
        { signal },
      );
      if (!response.ok) {
        throw new Error('Não foi possível carregar a lista de municípios do IBGE.');
      }

      return municipiosSchema.parse(await response.json());
    },
  });
}

export function useSalvarPerfil(userId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (perfil: PerfilUpdate) => {
      const { error } = await supabase
        .from('profiles')
        .update(perfil)
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['perfil', userId] });
    },
  });
}
