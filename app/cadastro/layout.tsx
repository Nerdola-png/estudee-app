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
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0A0C10;
          --surface: #12151C;
          --surface2: #1A1E28;
          --accent: #F5C542;
          --accent2: #E8A020;
          --text: #F0EDE4;
          --muted: #8A8D99;
          --border: #2A2E3A;
          --green: #3FC87A;
          --red: #F56565;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }

        .auth-wrapper {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* Painel esquerdo — decorativo */
        .auth-left {
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px;
          position: relative;
          overflow: hidden;
        }
        .auth-left::before {
          content: '';
          position: absolute;
          top: -100px;
          left: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(245,197,66,0.07) 0%, transparent 70%);
          border-radius: 50%;
        }
        .auth-left::after {
          content: '';
          position: absolute;
          bottom: -80px;
          right: -80px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(63,200,122,0.05) 0%, transparent 70%);
          border-radius: 50%;
        }

        .auth-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          letter-spacing: 3px;
          color: var(--accent);
          text-decoration: none;
          position: relative;
          z-index: 1;
        }
        .auth-logo span { color: var(--text); }

        .auth-left-content {
          position: relative;
          z-index: 1;
        }
        .auth-left-content h2 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 52px;
          line-height: 1;
          letter-spacing: 2px;
          margin-bottom: 16px;
        }
        .auth-left-content h2 em {
          color: var(--accent);
          font-style: normal;
        }
        .auth-left-content p {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.6;
          max-width: 360px;
          margin-bottom: 36px;
        }

        .auth-feature-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .auth-feature-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: var(--muted);
        }
        .auth-feature-list li span.icon {
          width: 28px;
          height: 28px;
          background: rgba(245,197,66,0.1);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .auth-left-footer {
          font-size: 12px;
          color: var(--border);
          position: relative;
          z-index: 1;
        }

        /* Painel direito — formulário */
        .auth-right {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px 40px;
          background: var(--bg);
          overflow-y: auto;
        }

        .auth-form-container {
          width: 100%;
          max-width: 420px;
        }

        /* Responsivo */
        @media (max-width: 768px) {
          .auth-wrapper { grid-template-columns: 1fr; }
          .auth-left { display: none; }
          .auth-right { padding: 32px 24px; justify-content: flex-start; padding-top: 60px; }
        }
      `}</style>
      {children}
    </>
  )
}
