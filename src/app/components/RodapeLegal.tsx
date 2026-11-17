'use client';

import Link from 'next/link';

export default function RodapeLegal() {
  return (
    <footer className="mt-12 border-t border-border pt-6 text-center">
      <p className="text-[10px] text-muted leading-relaxed max-w-md mx-auto">
        As questões exibidas são de provas públicas já aplicadas, de autoria das respectivas bancas organizadoras.
        {' '}
        <Link href="/termos" className="underline hover:text-text-base transition-colors">
          Termos de uso
        </Link>
      </p>
    </footer>
  );
}
