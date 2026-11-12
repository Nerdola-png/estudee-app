'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Field } from '@/app/components/Field';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useAlterarEmail, useRedefinirSenha } from '@/hooks/use-perfil';
import { perfilSchema, type PerfilData } from '@/schema/perfil';

interface SegurancaSectionProps {
  emailAtual: string;
  userId: string;
}

export function SegurancaSection({ emailAtual, userId }: SegurancaSectionProps) {
  const {
    formState: { errors },
  } = useFormContext<PerfilData>();

  const [modoEdicaoEmail, setModoEdicaoEmail] = useState(false);
  const [novoEmail, setNovoEmail] = useState('');
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('');
  const [emailEnviado, setEmailEnviado] = useState(false);

  const alterarEmail = useAlterarEmail(userId);
  const redefinirSenha = useRedefinirSenha();

  const handleAlterarEmail = async () => {
    if (!novoEmail || !senhaConfirmacao) return;

    try {
      await alterarEmail.mutateAsync({
        novoEmail,
        senhaAtual: senhaConfirmacao,
      });
      setEmailEnviado(true);
      setModoEdicaoEmail(false);
      setNovoEmail('');
      setSenhaConfirmacao('');
    } catch (error) {
      // Erro tratado pelo hook
    }
  };

  const handleRedefinirSenha = async () => {
    try {
      await redefinirSenha.mutateAsync(emailAtual);
      alert(
        'E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.'
      );
    } catch (error) {
      // Erro tratado pelo hook
    }
  };

  const handleCancelarEdicaoEmail = () => {
    setModoEdicaoEmail(false);
    setNovoEmail('');
    setSenhaConfirmacao('');
    setEmailEnviado(false);
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-7">
      <h2 className="mb-1 text-xl font-semibold text-text-base">Segurança</h2>
      <p className="mb-6 text-sm leading-6 text-muted">
        gerencie suas credenciais de acesso e segurança da conta.
      </p>

      <div className="space-y-6">
        {/* E-mail */}
        <div>
          <Field label="E-mail" error={errors.root?.message}>
            {!modoEdicaoEmail ? (
              <div className="flex items-center gap-2">
                <Input
                  value={emailAtual}
                  readOnly
                  className="h-11 bg-bg/40"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModoEdicaoEmail(true)}
                  className="shrink-0"
                >
                  Alterar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {!emailEnviado ? (
                  <>
                    <Input
                      type="email"
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      placeholder="Novo e-mail"
                      className="h-11"
                    />
                    <Input
                      type="password"
                      value={senhaConfirmacao}
                      onChange={(e) => setSenhaConfirmacao(e.target.value)}
                      placeholder="Senha atual para confirmar"
                      className="h-11"
                    />
                    <p className="text-xs text-muted">
                      Para alterar o e-mail, você precisa confirmar sua senha atual.
                      Um e-mail de confirmação será enviado para o novo endereço.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleAlterarEmail}
                        disabled={
                          !novoEmail ||
                          !senhaConfirmacao ||
                          alterarEmail.isPending
                        }
                        className="bg-accent text-bg hover:bg-accent2"
                      >
                        {alterarEmail.isPending
                          ? 'Enviando...'
                          : 'Enviar confirmação'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelarEdicaoEmail}
                      >
                        Cancelar
                      </Button>
                    </div>
                    {alterarEmail.isError && (
                      <p className="text-sm text-red-400">
                        {alterarEmail.error?.message ||
                          'Falha ao alterar e-mail. Verifique os dados e tente novamente.'}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-green/30 bg-green/10 p-4 text-green">
                    <p className="font-medium">E-mail de confirmação enviado!</p>
                    <p className="mt-1 text-sm">
                      Verifique sua caixa de entrada em {novoEmail} e clique no link
                      para confirmar a alteração.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEmailEnviado(false)}
                      className="mt-3"
                    >
                     Alterar para outro e-mail
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Field>
        </div>

        {/* Redefinição de Senha */}
        <div className="border-t border-border pt-6">
          <Field label="Senha">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                Receba um e-mail para criar uma nova senha.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleRedefinirSenha}
                disabled={redefinirSenha.isPending}
              >
                {redefinirSenha.isPending ? 'Enviando...' : 'Redefinir senha'}
              </Button>
            </div>
          </Field>
          {redefinirSenha.isSuccess && (
            <p className="mt-2 text-sm text-green">
              E-mail de redefinição enviado! Verifique sua caixa de entrada.
            </p>
          )}
          {redefinirSenha.isError && (
            <p className="mt-2 text-sm text-red-400">
              {redefinirSenha.error?.message ||
                'Falha ao enviar e-mail. Tente novamente.'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}