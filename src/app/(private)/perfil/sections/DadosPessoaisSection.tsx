'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Field } from '@/app/components/Field';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  useEnviarCodigoSMS,
  useVerificarCodigoSMS,
  useConcursos,
} from '@/hooks/use-perfil';
import { perfilSchema, type PerfilData } from '@/schema/perfil';

interface DadosPessoaisSectionProps {
  telefoneInicial: string;
  concursoAlvoInicial: string;
}

export function DadosPessoaisSection({
  telefoneInicial,
  concursoAlvoInicial,
}: DadosPessoaisSectionProps) {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<PerfilData>();

  const [telefone, setTelefone] = useState(telefoneInicial);
  const [telefoneEditavel, setTelefoneEditavel] = useState(telefoneInicial);
  const [mostrarInputTelefone, setMostrarInputTelefone] = useState(false);
  const [mostrarInputCodigo, setMostrarInputCodigo] = useState(false);
  const [codigoSms, setCodigoSms] = useState('');

  const enviarCodigoSMS = useEnviarCodigoSMS();
  const verificarCodigoSMS = useVerificarCodigoSMS();
  const concursos = useConcursos();

  const handleEditarTelefone = () => {
    setMostrarInputTelefone(true);
    setMostrarInputCodigo(false);
    setCodigoSms('');
  };

  const handleEnviarCodigo = async () => {
    if (!telefoneEditavel) return;

    try {
      await enviarCodigoSMS.mutateAsync(telefoneEditavel);
      setMostrarInputCodigo(true);
      setMostrarInputTelefone(false);
    } catch (error) {
      // Erro tratado pelo hook
    }
  };

  const handleVerificarCodigo = async () => {
    if (!codigoSms || codigoSms.length !== 6) return;

    try {
      await verificarCodigoSMS.mutateAsync({
        telefone: telefoneEditavel,
        codigo: codigoSms,
      });
      // Código verificado com sucesso, salvar telefone no perfil
      setValue('telefone', telefoneEditavel);
      setTelefone(telefoneEditavel);
      setMostrarInputTelefone(false);
      setMostrarInputCodigo(false);
    } catch (error) {
      // Erro tratado pelo hook
    }
  };

  const handleCancelarEdicaoTelefone = () => {
    setTelefoneEditavel(telefone);
    setMostrarInputTelefone(false);
    setMostrarInputCodigo(false);
    setCodigoSms('');
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-7">
      <h2 className="mb-1 text-xl font-semibold text-text-base">Dados Pessoais</h2>
      <p className="mb-6 text-sm leading-6 text-muted">
        gerencie suas informações pessoais e de contato.
      </p>

      <div className="space-y-5">
        {/* Telefone */}
        <div>
          <Field label="Telefone" error={errors.telefone?.message}>
            {!mostrarInputTelefone && !mostrarInputCodigo ? (
              <div className="flex items-center gap-2">
                <Input
                  value={telefone || 'Não informado'}
                  readOnly
                  className="h-11 bg-bg/40"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEditarTelefone}
                  className="shrink-0"
                >
                  {telefone ? 'Alterar' : 'Adicionar'}
                </Button>
              </div>
            ) : mostrarInputTelefone ? (
              <div className="space-y-3">
                <Input
                  value={telefoneEditavel}
                  onChange={(e) => setTelefoneEditavel(e.target.value)}
                  placeholder="Ex.: 11999999999"
                  maxLength={11}
                  className="h-11"
                />
                <p className="text-xs text-muted">
                  Digite apenas números com DDD (10 ou 11 dígitos).
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleEnviarCodigo}
                    disabled={
                      telefoneEditavel.length < 10 ||
                      enviarCodigoSMS.isPending
                    }
                    className="bg-accent text-bg hover:bg-accent2"
                  >
                    {enviarCodigoSMS.isPending ? 'Enviando...' : 'Enviar código'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelarEdicaoTelefone}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted">
                  Enviamos um código SMS para {telefoneEditavel}.
                </p>
                <Input
                  value={codigoSms}
                  onChange={(e) => setCodigoSms(e.target.value)}
                  placeholder="Código de 6 dígitos"
                  maxLength={6}
                  className="h-11 text-center tracking-widest"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleVerificarCodigo}
                    disabled={codigoSms.length !== 6 || verificarCodigoSMS.isPending}
                    className="bg-accent text-bg hover:bg-accent2"
                  >
                    {verificarCodigoSMS.isPending ? 'Verificando...' : 'Verificar código'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMostrarInputCodigo(false);
                      setMostrarInputTelefone(true);
                    }}
                  >
                    Voltar
                  </Button>
                </div>
                {(verificarCodigoSMS.isError) && (
                  <p className="text-xs text-red-400">
                    {verificarCodigoSMS.error?.message ||
                      'Código inválido. Tente novamente.'}
                  </p>
                )}
              </div>
            )}
          </Field>
        </div>

        {/* Concurso Alvo */}
        <Field label="Concurso/Prova alvo" error={errors.concurso_alvo?.message}>
          <select
            {...register('concurso_alvo')}
            className="h-11 w-full rounded-xl border border-border bg-bg/60 px-3 text-sm text-text-base outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="">Selecione o concurso alvo</option>
            {concursos.data?.map((concurso) => (
              <option key={concurso.id} value={concurso.id}>
                {concurso.nome}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </section>
  );
}