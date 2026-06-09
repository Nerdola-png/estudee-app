'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import '../estudee.css'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const errorParam = searchParams.get('error')
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !senha) {
      setError('Preencha e-mail e senha.')
      return
    }

    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })

    if (authError) {
      if (
        authError.message.includes('Invalid login credentials') ||
        authError.message.includes('invalid_credentials')
      ) {
        setError('E-mail ou senha incorretos.')
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.')
      } else {
        setError('Ocorreu um erro. Tente novamente.')
      }
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail.trim()) return

    setResetLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      resetEmail.trim(),
      { redirectTo: `${window.location.origin}/auth/reset-password` }
    )

    if (!resetError) {
      setResetSent(true)
    }
    setResetLoading(false)
  }

  // ── Tela de reset enviado ────────────────────────────────────────────────
  if (resetSent) {
    return (
      <div className="auth-wrapper">
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <LeftPanel />
        <div className="auth-right">
          <div className="auth-form-container" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '20px' }}>📬</div>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '36px', letterSpacing: '2px', marginBottom: '12px',
            }}>
              VERIFIQUE SEU E-MAIL
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '28px' }}>
              Enviamos um link para{' '}
              <strong style={{ color: 'var(--text)' }}>{resetEmail}</strong>.
              Clique no link para redefinir sua senha.
            </p>
            <button
              style={{
                background: 'none', border: 'none', color: 'var(--accent)',
                cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit',
              }}
              onClick={() => { setResetSent(false); setShowReset(false); setResetEmail('') }}
            >
              ← Voltar ao login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Tela de reset de senha ────────────────────────────────────────────────
  if (showReset) {
    return (
      <div className="auth-wrapper">
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <LeftPanel />
        <div className="auth-right">
          <div className="auth-form-container">
            <div style={{ marginBottom: '32px' }}>
              <button
                onClick={() => setShowReset(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--muted)',
                  cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: 0, marginBottom: '20px',
                }}
              >
                ← Voltar
              </button>
              <h1 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '38px', letterSpacing: '2px', marginBottom: '8px',
              }}>
                RECUPERAR SENHA
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5 }}>
                Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.
              </p>
            </div>

            <form onSubmit={handleResetPassword} noValidate>
              <Field label="E-mail" style={{ marginBottom: '20px' }}>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </Field>

              <button
                type="submit"
                disabled={resetLoading}
                style={{
                  width: '100%', padding: '14px', borderRadius: '8px',
                  background: resetLoading ? 'var(--surface2)' : 'var(--accent)',
                  color: resetLoading ? 'var(--muted)' : '#0A0C10',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700, fontSize: '15px', border: 'none',
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                  transition: 'all .2s',
                }}
              >
                {resetLoading ? 'Enviando…' : 'Enviar link de recuperação →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── Tela principal de login ───────────────────────────────────────────────
  return (
    <div className="auth-wrapper">
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <LeftPanel />

      <div className="auth-right">
        <div className="auth-form-container">
          {/* Header */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(245,197,66,0.1)', border: '1px solid rgba(245,197,66,0.25)',
              color: 'var(--accent)', padding: '5px 12px', borderRadius: '100px',
              fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
              textTransform: 'uppercase', marginBottom: '16px',
            }}>
              🔥 Sequência te esperando
            </div>
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '38px', letterSpacing: '2px', marginBottom: '8px',
            }}>
              BEM-VINDO DE VOLTA
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Não tem conta?{' '}
              <Link href="/cadastro" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                Criar conta grátis
              </Link>
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} noValidate>
            {errorParam === 'callback' && (
  <div style={{
    background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.3)',
    borderRadius: '8px', padding: '12px 14px', marginBottom: '20px',
    fontSize: '13px', color: '#fc8181',
  }}>
    Não foi possível entrar com o Google. Tente novamente ou use e-mail e senha.
  </div>
)}
            {error && (
              <div style={{
                background: 'rgba(245,101,101,0.1)', border: '1px solid rgba(245,101,101,0.3)',
                borderRadius: '8px', padding: '12px 14px', marginBottom: '20px',
                fontSize: '13px', color: '#fc8181',
              }}>
                {error}
              </div>
            )}

            {/* E-mail */}
            <Field label="E-mail" style={{ marginBottom: '16px' }}>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                autoComplete="email"
                autoFocus
              />
            </Field>

            {/* Senha */}
            <Field label="Senha" style={{ marginBottom: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showSenha ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={senha}
                  onChange={e => { setSenha(e.target.value); setError('') }}
                  autoComplete="current-password"
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

            {/* Esqueci a senha */}
            <div style={{ textAlign: 'right', marginBottom: '28px' }}>
              <button
                type="button"
                onClick={() => { setShowReset(true); setResetEmail(email) }}
                style={{
                  background: 'none', border: 'none', color: 'var(--muted)',
                  cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
                  textDecoration: 'underline', padding: 0,
                }}
              >
                Esqueci minha senha
              </button>
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
                transition: 'all .2s', marginBottom: '20px',
              }}
            >
              {loading ? 'Entrando…' : 'Entrar →'}
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '20px',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>ou</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* OAuth Google */}
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirect}` },
                })
              }}
              style={{
                width: '100%', padding: '13px', borderRadius: '8px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text)', fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                transition: 'border-color .2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--muted)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <GoogleIcon />
              Entrar com Google
            </button>
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}