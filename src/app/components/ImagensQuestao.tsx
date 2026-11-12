type Imagem = { path: string; alt: string };

const BUCKET = "questoes-imagens";

function urlPublica(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

export function ImagensQuestao({ imagens }: { imagens: Imagem[] }) {
  if (imagens.length === 0) return null;

  return (
    <div className="mb-4 space-y-3">
      {imagens.map((imagem) => (
        <figure key={imagem.path} className="overflow-x-auto rounded-lg border border-border bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urlPublica(imagem.path)}
            alt={imagem.alt}
            loading="lazy"
            className="mx-auto h-auto max-w-full"
          />
        </figure>
      ))}
    </div>
  );
}
