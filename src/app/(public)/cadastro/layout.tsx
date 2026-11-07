import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Estudee — Acesse sua conta',
  description: 'Entre ou crie sua conta no Estudee',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
