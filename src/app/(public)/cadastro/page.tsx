"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/app/components/Field";
import { LeftPanel } from "@/app/components/LeftPanel";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cadastroSchema, type CadastroData } from "@/schema/cadastro";

const ESTADOS_BR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const CONCURSOS = ["Polícia Civil","Polícia Militar","Polícia Federal","Polícia Rodoviária Federal","Tribunal de Justiça (TJ)","Tribunal Regional Federal (TRF)","Ministério Público","Defensoria Pública","OAB","Banco do Brasil","Caixa Econômica Federal","INSS","Receita Federal","TCU / TCE","Prefeitura / Câmara Municipal","Não tenho certeza"];

export default function CadastroPage() {
  const supabase = createClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showSenha, setShowSenha] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CadastroData>({ resolver: zodResolver(cadastroSchema) });

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("root", { message: "A foto deve ter no máximo 2MB." });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: CadastroData) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.senha,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          nome: data.nome.trim(),
          sobrenome: data.sobrenome.trim(),
          cidade: data.cidade.trim(),
          estado: data.estado,
        },
      },
    });

    if (authError) {
      setError("root", {
        message: authError.message.includes("already registered")
          ? "Este e-mail já está cadastrado. Tente fazer login."
          : authError.message,
      });
      return;
    }

    if (authData.user && avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `avatars/${authData.user.id}.${ext}`;
      await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", authData.user.id);
    }

    if (authData.user) {
      await supabase.from("profiles").update({
        telefone: data.telefone || null,
        concurso_alvo: data.concurso_alvo || null,
      }).eq("id", authData.user.id);
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen grid md:grid-cols-2">
        <LeftPanel />
        <div className="flex flex-col justify-center items-center p-12 bg-bg">
          <div className="w-full max-w-[420px] text-center">
            <div className="text-5xl mb-5">✉️</div>
            <h2 className="font-bebas text-4xl tracking-widest mb-3">CONFIRME SEU E-MAIL</h2>
            <p className="text-muted leading-relaxed mb-7">
              Enviamos um link para{" "}
              <strong className="text-text-base">{getValues("email")}</strong>.
            </p>
            <button
              className="text-accent text-sm bg-transparent border-none cursor-pointer font-[inherit]"
              onClick={() => setSuccess(false)}
            >
              Não recebeu? Tente novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <LeftPanel />
      <div className="flex flex-col justify-center items-center p-12 bg-bg overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/25 text-accent px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-4">
              🎯 Gratuito, sem cartão
            </div>
            <h1 className="font-bebas text-4xl tracking-widest mb-2">CRIE SUA CONTA</h1>
            <p className="text-muted text-sm">
              Já tem conta?{" "}
              <Link href="/login" className="text-accent font-semibold no-underline">
                Entrar
              </Link>
            </p>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-7">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-[72px] h-[72px] rounded-full bg-surface2 border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 transition-colors hover:border-accent"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold mb-1">Foto de perfil</div>
              <div className="text-xs text-muted leading-snug">
                Sua foto aparece no ranking.<br />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-accent text-xs bg-transparent border-none cursor-pointer font-[inherit] p-0 underline"
                >
                  {avatarPreview ? "Trocar foto" : "Adicionar foto"}
                </button>
              </div>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {errors.root?.message && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3.5 py-3 text-[13px] text-red-400">
                {errors.root.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome" error={errors.nome?.message}>
                <Input {...register("nome")} placeholder="João" autoComplete="given-name" />
              </Field>
              <Field label="Sobrenome" error={errors.sobrenome?.message}>
                <Input {...register("sobrenome")} placeholder="Silva" autoComplete="family-name" />
              </Field>
            </div>

            <Field label="E-mail" error={errors.email?.message}>
              <Input {...register("email")} type="email" placeholder="joao@email.com" autoComplete="email" />
            </Field>

            <Field label="Senha" error={errors.senha?.message}>
              <div className="relative">
                <Input
                  {...register("senha")}
                  type={showSenha ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-base bg-transparent border-none cursor-pointer leading-none"
                  aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showSenha ? "🙈" : "👁️"}
                </button>
              </div>
            </Field>

            <Field label="Confirmar Senha" error={errors.confirmarSenha?.message}>
              <Input
                {...register("confirmarSenha")}
                type={showSenha ? "text" : "password"}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </Field>

            <div className="grid grid-cols-[1fr_90px] gap-3">
              <Field label="Cidade" error={errors.cidade?.message}>
                <Input {...register("cidade")} placeholder="Porto Alegre" autoComplete="address-level2" />
              </Field>
              <Field label="Estado" error={errors.estado?.message}>
                <Select
                  onValueChange={(v) =>
                    setValue("estado", v as string, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="border-t border-border pt-4">
              <div className="text-[11px] font-bold tracking-widest text-muted uppercase mb-3">
                Opcional
              </div>
              <div className="flex flex-col gap-3">
                <Field label="Telefone">
                  <Input {...register("telefone")} type="tel" placeholder="(51) 9 9999-9999" autoComplete="tel" />
                </Field>
                <Field label="Concurso alvo">
                  <Select
                    onValueChange={(v) =>
                      setValue("concurso_alvo", v as string)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONCURSOS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-accent text-bg font-bold hover:bg-accent2"
            >
              {isSubmitting ? "Criando conta…" : "Criar Conta Gratuita →"}
            </Button>

            <p className="text-[11px] text-muted text-center leading-relaxed">
              Ao criar uma conta, você concorda com os{" "}
              <Link href="/termos" className="text-muted underline">Termos de Uso</Link>{" "}
              e a{" "}
              <Link href="/privacidade" className="text-muted underline">Política de Privacidade</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
