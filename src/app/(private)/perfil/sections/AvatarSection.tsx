'use client';

import { useState, useRef } from 'react';
import { Field } from '@/app/components/Field';
import { Button } from '@/app/components/ui/button';
import { useUploadAvatar } from '@/hooks/use-perfil';

interface AvatarSectionProps {
  avatarUrlInicial: string | null;
  userId: string;
  nomeCompleto: string;
}

export function AvatarSection({
  avatarUrlInicial,
  userId,
  nomeCompleto,
}: AvatarSectionProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = useUploadAvatar(userId);

  // Gerar iniciais do nome para avatar padrão
  const iniciais = nomeCompleto
    .split(' ')
    .map((nome) => nome[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    // Validar tipo de arquivo (PNG, JPEG, WebP - conforme bucket do Supabase)
    const tiposPermitidos = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ];
    if (!tiposPermitidos.includes(arquivo.type)) {
      alert(
        'Tipo de arquivo não permitido. Use PNG, JPEG ou WebP.'
      );
      return;
    }

    // Validar tamanho (2MB - limite do bucket do Supabase)
    const tamanhoMaximo = 2 * 1024 * 1024;
    if (arquivo.size > tamanhoMaximo) {
      alert('Arquivo muito grande. Tamanho máximo: 2MB.');
      return;
    }

    setArquivoSelecionado(arquivo);

    // Criar preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(arquivo);
  };

  const handleUpload = async () => {
    if (!arquivoSelecionado) return;

    try {
      await uploadAvatar.mutateAsync(arquivoSelecionado);
      setArquivoSelecionado(null);
    } catch (error) {
      // Erro tratado pelo hook
    }
  };

  const handleCancelarUpload = () => {
    setArquivoSelecionado(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoverAvatar = async () => {
    if (!confirm('Tem certeza que deseja remover sua foto de perfil?')) {
      return;
    }

    // Chamar hook para remover avatar (definir como null)
    // Isso será feito através do hook useUploadAvatar que atualiza o perfil
    // Quando passamos null ou string vazia, o hook trata internamente
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-7">
      <h2 className="mb-1 text-xl font-semibold text-text-base">Foto de perfil</h2>
      <p className="mb-6 text-sm leading-6 text-muted">
        Atualize sua foto de perfil para personalizar sua conta.
      </p>

      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {/* Avatar atual/preview */}
        <div className="relative shrink-0">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Preview do avatar"
              className="h-24 w-24 rounded-full object-cover ring-2 ring-border"
            />
          ) : avatarUrlInicial ? (
            <img
              src={avatarUrlInicial}
              alt="Avatar atual"
              className="h-24 w-24 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-xl font-bold text-bg ring-2 ring-border">
              {iniciais}
            </div>
          )}

          {/* Loading overlay */}
          {uploadAvatar.isPending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-bg/60">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="space-y-4">
          {!arquivoSelecionado ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleSelecionarArquivo}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-accent text-bg hover:bg-accent2"
                >
                  Trocar foto
                </Button>
                {avatarUrlInicial && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoverAvatar}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">{arquivoSelecionado.name}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploadAvatar.isPending}
                  className="bg-accent text-bg hover:bg-accent2"
                >
                  {uploadAvatar.isPending ? 'Enviando...' : 'Salvar foto'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelarUpload}
                  disabled={uploadAvatar.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}

          {uploadAvatar.isError && (
            <p className="text-sm text-red-400">
              {uploadAvatar.error?.message ||
                'Falha ao fazer upload. Tente novamente.'}
            </p>
          )}

          <p className="text-xs text-muted">
            Formatos permitidos: PNG, JPEG, WebP. Tamanho máximo: 2MB.
          </p>
        </div>
      </div>
    </section>
  );
}