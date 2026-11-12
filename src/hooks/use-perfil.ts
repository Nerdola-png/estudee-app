import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import type { TablesUpdate } from '@/types/database';

const municipiosSchema = z.array(z.object({
  id: z.number().int(),
  nome: z.string(),
}));

export type MunicipioIBGE = z.infer<typeof municipiosSchema>[number];

// Tipos atualizados para incluir novos campos
type PerfilUpdate = Pick<
  TablesUpdate<'profiles'>,
  | 'nickname'
  | 'ranking_opt_in'
  | 'uf'
  | 'municipio_ibge'
  | 'cidade'
  | 'estado'
  | 'telefone'
  | 'concurso_alvo'
  | 'avatar_url'
>;

// --- Hook para municípios do IBGE ---
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

// --- Hook para salvar perfil completo ---
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

// --- Hook para upload de avatar ---
export function useUploadAvatar(userId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      // Validar tipo de arquivo
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido. Use PNG, JPEG ou WebP.');
      }

      // Validar tamanho (2MB máximo - limite do bucket do Supabase)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 2MB.');
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `avatar-${timestamp}.${extension}`;
      const filePath = `${userId}/${fileName}`;

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '31536000', // 1 ano
          upsert: true,
        });

      if (error) {
        console.error('Erro no upload do avatar:', error);
        throw new Error(`Falha ao fazer upload: ${error.message}`);
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    },
    onSuccess: async (newAvatarUrl) => {
      // Atualizar avatar_url no perfil
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao salvar avatar_url:', error);
        throw new Error(`Falha ao salvar avatar: ${error.message}`);
      }

      await queryClient.invalidateQueries({ queryKey: ['perfil', userId] });
    },
  });
}

// --- Hook para enviar código de verificação por SMS (telefone) ---
export function useEnviarCodigoSMS() {
  const supabase = createClient();

  return useMutation({
    mutationFn: async (telefone: string) => {
      // Formatar telefone para formato E.164
      const telefoneFormatado = telefone.replace(/\D/g, '');
      const telefoneE164 = `+55${telefoneFormatado}`;

      // Usar signInWithOtp para enviar código SMS
      const { error } = await supabase.auth.signInWithOtp({
        phone: telefoneE164,
        options: {
          shouldCreateUser: false, // Não criar usuário se não existir
        },
      });

      if (error) {
        // Tratar erro específico de telefone inválido
        if (error.message.includes('phone')) {
          throw new Error('Telefone inválido. Verifique o número e tente novamente.');
        }
        throw new Error('Falha ao enviar código SMS. Tente novamente.');
      }
    },
  });
}

// --- Hook para verificar código SMS ---
export function useVerificarCodigoSMS() {
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ telefone, codigo }: { telefone: string; codigo: string }) => {
      const telefoneFormatado = telefone.replace(/\D/g, '');
      const telefoneE164 = `+55${telefoneFormatado}`;

      const { error } = await supabase.auth.verifyOtp({
        phone: telefoneE164,
        token: codigo,
        type: 'sms',
      });

      if (error) {
        throw new Error('Código inválido ou expirado. Tente novamente.');
      }

      return true;
    },
  });
}

// --- Hook para alterar e-mail com re-autenticação ---
export function useAlterarEmail(userId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      novoEmail,
      senhaAtual,
    }: {
      novoEmail: string;
      senhaAtual: string;
    }) => {
      // Passo 1: Re-autenticar com senha atual e email atual
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Tentar re-autenticar com as credenciais atuais
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email!,
        password: senhaAtual,
      });

      if (signInError) {
        throw new Error('Senha atual incorreta.');
      }

      // Passo 2: Atualizar o e-mail (o Supabase envia automaticamente e-mail de confirmação)
      const { error: updateError } = await supabase.auth.updateUser({
        email: novoEmail,
      });

      if (updateError) {
        // Tratar erro de e-mail já em uso
        if (updateError.message.includes('already')) {
          throw new Error('Este e-mail já está em uso por outra conta.');
        }
        throw new Error(updateError.message);
      }

      return true;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['perfil', userId] });
    },
  });
}

// --- Hook para solicitar redefinição de senha ---
export function useRedefinirSenha() {
  const supabase = createClient();

  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw new Error('Falha ao enviar e-mail de redefinição. Tente novamente.');
      }

      return true;
    },
  });
}

// --- Hook para obter opções de concursos (mock - pode ser expandido para API) ---
export function useConcursos() {
  return useQuery({
    queryKey: ['concursos'],
    staleTime: 24 * 60 * 60 * 1000, // 24 horas
    queryFn: async () => {
      // Lista de concursos comuns (pode ser expandida para API externa)
      return [
        { id: 'federal', nome: 'Concursos Federais' },
        { id: 'estadual', nome: 'Concursos Estaduais' },
        { id: 'municipal', nome: 'Concursos Municipais' },
        { id: 'vestibular', nome: 'Vestibulares' },
        { id: 'oab', nome: 'OAB' },
        { id: 'enem', nome: 'Enem' },
        { id: 'fuvest', nome: 'Fuvest' },
        { id: 'unicamp', nome: 'Unicamp' },
        { id: 'ita', nome: 'ITA' },
        { id: 'ime', nome: 'IME' },
        { id: 'bb', nome: 'Banco do Brasil' },
        { id: 'caixa', nome: 'Caixa Econômica' },
        { id: 'bndes', nome: 'BNDES' },
        { id: 'ibama', nome: 'IBAMA' },
        { id: 'icmbio', nome: 'ICMBio' },
        { id: 'pf', nome: 'Polícia Federal' },
        { id: 'prf', nome: 'Polícia Rodoviária Federal' },
        { id: 'receita', nome: 'Receita Federal' },
        { id: 'fiscal', nome: 'Fiscal Tributário' },
        { id: 'magisterio', nome: 'Magistério' },
        { id: 'saude', nome: 'Área da Saúde' },
        { id: 'ti', nome: 'Tecnologia da Informação' },
        { id: 'outro', nome: 'Outro' },
      ];
    },
  });
}