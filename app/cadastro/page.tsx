'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
]

const CONCURSOS = [
  'Polícia Civil',
  'Polícia Militar',
  'Polícia Federal',
  'Polícia Rodoviária Federal',
  'Tribunal de Justiça (TJ)',
  'Tribunal Regional Federal (TRF)',
  'Ministério Público',
  'Defensoria Pública',
  'OAB',
  'Banco do Brasil',
  'Caixa Econômica Federal',
  'INSS',
  'Receita Federal',
  'TCU / TCE',
  'Prefeitura / Câmara Municipal',
  'Não tenho certeza',
]

type FormData = {
  nome: string
  sobrenome: string
  email: string
  senha: string
  confirmarSenha: string
  cidade: string
  estado: string
  telefone: string
  concurso_alvo: string
}

type FieldErrors = Partial<Record<keyof FormData, string>>

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormData>({
    nome: '', sobrenome: '', email: '', senha: '',
    confirmarSenha: '', cidade: '', estado: '',
    telefone: '', concurso_alvo: '',
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [globalError, setGlobalError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showSenha, setShowSenha] = useState(false)

  const update = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev }))
      setGlobalError('A foto deve ter no máximo 2MB.')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setGlobalError('')
  }

  const validate = (): boolean => {
    const errs: FieldErrors = {}
    if (!form.nome.trim()) errs.nome = 'Informe seu nome.'
    if (!form.sobrenome.trim()) errs.sobrenome = 'Informe seu sobrenome.'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'E-mail inválido.'
    if (form.senha.length < 8) errs.senha = 'A senha deve ter pelo menos 8 caracteres.'
    if (form.senha !== form.confirmarSenha)
      errs.confirmarSenha = 'As senhas não coincidem.'
    if (!form.cidade.trim()) errs.cidade = 'Informe sua cidade.'
    if (!form.estado) errs.estado = 'Selecione seu estado.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setGlobalError('')

    try {
      // 1. Criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            nome: form.nome.trim(),
            sobrenome: form.sobrenome.trim(),
            cidade: form.cidade.trim(),
            estado: form.estado,
          },
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setGlobalError('Este e-mail já está cadastrado. Tente fazer login.')
        } else {
          setGlobalError(authError.message)
        }
        return
      }

      // 2. Se o usuário foi criado e temos um avatar, fazer upload
      if (authData.user && avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `avatars/${authData.user.id}.${ext}`
        await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
        // O perfil é criado pelo trigger — atualizamos o avatar_url
        await supabase
          .from('profiles')
          .update({ avatar_url: path })
          .eq('id', authData.user.id)
      }

      // 3. Atualizar campos opcionais no perfil
      if (authData.user) {
        await supabase.from('profiles').update({
          telefone: form.telefone || null,
          concurso_alvo: form.concurso_alvo || null,
        }).eq('id', authData.user.id)
      }

      setSuccess(true)
    } catch {
      setGlobalError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-wrapper">
        <LeftPanel />
        <div className="auth-right">
          <div className="auth-form-container" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '20px' }}>✉️</div>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '36px',
              letterSpacing: '2px',
              marginBottom: '12px',
            }}>
              CONFIRME SEU E-MAIL
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '28px' }}>
              Enviamos um link de confirmação para <strong style={{ color: 'var(--text)' }}>{form.email}</strong>.
              Clique no link para ativar sua conta e começar a estudar.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Não recebeu?{' '}
              <button
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}
                onClick={() => setSuccess(false)}
              >
                Tente novamente
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrapper">
      <LeftPanel />
      <div className="auth-right">
        <div className="auth-form-container">
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(245,197,66,0.1)', border: '1px solid rgba(245,197,66,0.25)',
              color: 'var(--accent)', padding: '5px 12px', borderRadius: '100px',
              fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
              textTransform: 'uppercase', marginBottom: '16px',
            }}>
              🎯 Gratuito, sem cartão
            </div>
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '38px', letterSpacing: '2px', marginBottom: '8px',
            }}>
              CRIE SUA CONTA
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Já tem conta?{' '}
              <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                Entrar
              </Link>
            </p>
          </div>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
            <div
              onClick={() => avatarInputRef.current?.click()}
              style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: avatarPreview ? 'transparent' : 'var(--surface2)',
                border: `2px dashed ${avatarPreview ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                transition: 'border-color .2s',
              }}
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '26px' }}>👤</span>
              }
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                Foto de perfil
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                Sua foto aparece no ranking.<br />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    background: 'none', border: 'none', color: 'var(--accent)',
                    cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
                    padding: 0, textDecoration: 'underline',
                  }}
                >
                  {avatarPreview ? 'Trocar foto' : 'Adicionar foto'}
                </button>
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatar}
            />
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} noValidate>
            {globalError && (
              <div style={{
                background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.3)',
                borderRadius: '8px', padding: '12px 14px', marginBottom: '20px',
                fontSize: '13px', color: '#fc8181',
              }}>
                {globalError}
              </div>
            )}

            {/* Nome e Sobrenome */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <Field label="Nome" error={errors.nome}>
                <Input placeholder="João" value={form.nome} onChange={update('nome')} autoComplete="given-name" />
              </Field>
              <Field label="Sobrenome" error={errors.sobrenome}>
                <Input placeholder="Silva" value={form.sobrenome} onChange={update('sobrenome')} autoComplete="family-name" />
              </Field>
            </div>

            {/* E-mail */}
            <Field label="E-mail" error={errors.email} style={{ marginBottom: '16px' }}>
              <Input type="email" placeholder="joao@email.com" value={form.email} onChange={update('email')} autoComplete="email" />
            </Field>

            {/* Senha */}
            <Field label="Senha" error={errors.senha} style={{ marginBottom: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showSenha ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={form.senha}
                  onChange={update('senha')}
                  autoComplete="new-password"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--muted)',
                    fontSize: '16px', lineHeight: 1,
                  }}
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showSenha ? '🙈' : '👁️'}
                </button>
              </div>
            </Field>

            {/* Confirmar senha */}
            <Field label="Confirmar Senha" error={errors.confirmarSenha} style={{ marginBottom: '16px' }}>
              <Input
                type={showSenha ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={form.confirmarSenha}
                onChange={update('confirmarSenha')}
                autoComplete="new-password"
              />
            </Field>

            {/* Cidade e Estado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '16px' }}>
              <Field label="Cidade" error={errors.cidade}>
                <Input placeholder="Porto Alegre" value={form.cidade} onChange={update('cidade')} autoComplete="address-level2" />
              </Field>
              <Field label="Estado" error={errors.estado} style={{ minWidth: '90px' }}>
                <Select value={form.estado} onChange={update('estado')}>
                  <option value="">UF</option>
                  {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </Select>
              </Field>
            </div>

            {/* Campos opcionais */}
            <div style={{
              borderTop: '1px solid var(--border)', paddingTop: '16px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                Opcional
              </div>
              <Field label="Telefone" style={{ marginBottom: '12px' }}>
                <Input type="tel" placeholder="(51) 9 9999-9999" value={form.telefone} onChange={update('telefone')} autoComplete="tel" />
              </Field>
              <Field label="Concurso alvo">
                <Select value={form.concurso_alvo} onChange={update('concurso_alvo')}>
                  <option value="">Selecione (opcional)</option>
                  {CONCURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: '8px',
                background: loading ? 'var(--surface2)' : 'var(--accent)',
                color: loading ? 'var(--muted)' : '#0A0C10',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700, fontSize: '15px', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all .2s', marginTop: '8px',
              }}
            >
              {loading ? 'Criando conta…' : 'Criar Conta Gratuita →'}
            </button>

            <p style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '14px', lineHeight: 1.5 }}>
              Ao criar uma conta, você concorda com os{' '}
              <Link href="/termos" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Termos de Uso</Link>
              {' '}e a{' '}
              <Link href="/privacidade" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Política de Privacidade</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Componentes auxiliares ────────────────────────────────────────────────

function LeftPanel() {
  return (
    <div className="auth-left">
      <Link href="/" className="auth-logo">ESTU<span>DEE</span></Link>
      <div className="auth-left-content">
        <h2>
          QUESTÕES REAIS,<br />
          RANKING <em>REAL</em>,<br />
          APROVAÇÃO REAL.
        </h2>
        <p>
          Estude com questões de provas já aplicadas, acumule pontos e veja seu nome subir no ranking da sua cidade.
        </p>
        <ul className="auth-feature-list">
          <li><span className="icon">🎯</span> Filtros por banca, cargo, matéria e estado</li>
          <li><span className="icon">🔥</span> Sequência de estudos — não deixe o fogo apagar</li>
          <li><span className="icon">🏆</span> Ranking por cidade, estado e nacional</li>
          <li><span className="icon">📊</span> Histórico inteligente: sem repetir o que já acertou</li>
        </ul>
      </div>
      <div className="auth-left-footer">Estudee © 2025 — Versão Web</div>
    </div>
  )
}

function Field({
  label, error, children, style,
}: {
  label: string
  error?: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={style}>
      <label style={{
        display: 'block', fontSize: '12px', fontWeight: 600,
        color: error ? '#fc8181' : 'var(--muted)',
        marginBottom: '6px', letterSpacing: '.3px',
      }}>
        {label}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: '11px', color: '#fc8181', marginTop: '4px', display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  )
}

function Input({
  style, ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      style={{
        width: '100%', padding: '10px 13px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '7px', color: 'var(--text)',
        fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
        outline: 'none', transition: 'border-color .2s',
        ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(245,197,66,0.5)' }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
      {...props}
    />
  )
}

function Select({
  children, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      style={{
        width: '100%', padding: '10px 13px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '7px', color: 'var(--text)',
        fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
        outline: 'none', transition: 'border-color .2s', cursor: 'pointer',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(245,197,66,0.5)' }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
      {...props}
    >
      {children}
    </select>
  )
}
