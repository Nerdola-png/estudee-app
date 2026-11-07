import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Estudee — Acesse sua conta',
  description: 'Entre ou crie sua conta no Estudee',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
