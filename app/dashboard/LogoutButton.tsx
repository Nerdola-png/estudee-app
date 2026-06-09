'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: '7px',
        color: 'var(--muted)',
        padding: '8px 16px',
        fontSize: '13px',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all .2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--muted)'
        e.currentTarget.style.color = 'var(--text)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = 'var(--muted)'
      }}
    >
      Sair
    </button>
  )
}