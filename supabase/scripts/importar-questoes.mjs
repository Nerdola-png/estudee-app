import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const csvColumns = [
  "codigo",
  "foco",
  "tipo",
  "banca_slug",
  "materia_slug",
  "cargo_slug",
  "carreira_slug",
  "estado_prova",
  "ano",
  "enunciado",
  "alternativas",
  "gabarito",
  "justificativa",
  "justificativa_alternativas",
  "ativo",
  "peso_dificuldade",
  "t_ref_segundos",
  "status_gabarito",
];

const alternativasSchema = z.array(
  z.object({
    key: z.string().regex(/^[A-E]$/),
    texto: z.string().trim().min(1),
  }),
).min(2).max(5).superRefine((alternativas, context) => {
  const keys = alternativas.map(({ key }) => key);
  if (new Set(keys).size !== keys.length) {
    context.addIssue({ code: "custom", message: "As alternativas não podem repetir letras." });
  }
});

const questaoSchema = z.object({
  codigo: z.string().trim().min(1),
  foco: z.enum(["concurso", "vestibular", "oab"]),
  tipo: z.enum(["multipla_escolha", "certo_errado"]),
  estado_prova: z.string().trim().min(2),
  ano: z.number().int().min(1900).max(2100),
  enunciado: z.string().trim().min(1),
  alternativas: alternativasSchema,
  gabarito: z.string().regex(/^[A-E]$/).nullable(),
  justificativa: z.string().trim().nullable(),
  justificativa_alternativas: z.record(z.string(), z.string()).nullable(),
  ativo: z.boolean(),
  peso_dificuldade: z.number().int().min(1).max(3),
  t_ref_segundos: z.number().int().min(1).max(1800),
  status_gabarito: z.enum(["nao_verificado", "preliminar", "definitivo", "anulada", "pendente"]),
});

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("O CSV termina com uma aspa sem fechamento.");
  row.push(field);
  if (row.some((value) => value.length > 0)) rows.push(row);
  if (rows.length < 2) throw new Error("O CSV precisa conter o cabeçalho e ao menos uma questão.");

  const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
  const missingColumns = csvColumns.filter((column) => !headers.includes(column));
  if (missingColumns.length > 0) {
    throw new Error(`Colunas ausentes no CSV: ${missingColumns.join(", ")}.`);
  }

  return rows.slice(1).map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`Linha ${index + 2}: esperadas ${headers.length} colunas, recebidas ${values.length}.`);
    }
    return Object.fromEntries(headers.map((header, columnIndex) => [header, values[columnIndex].trim()]));
  });
}

function parseBoolean(value, line) {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new Error(`Linha ${line}: "ativo" deve ser true, false, 1 ou 0.`);
}

function parseJson(value, line, column) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Linha ${line}: JSON inválido na coluna "${column}".`);
  }
}

function getServiceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Defina SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function loadLookup(supabase, table) {
  const { data, error } = await supabase.from(table).select("id,slug");
  if (error) throw new Error(`Falha ao carregar ${table}: ${error.message}`);
  return new Map(data.map(({ id, slug }) => [slug, id]));
}

async function main() {
  const [filePath] = process.argv.slice(2);
  if (!filePath) {
    throw new Error("Uso: npm run seed -- <arquivo.csv>");
  }

  const records = parseCsv(await readFile(filePath, "utf8"));
  const supabase = getServiceClient();
  const [bancas, materias, cargos, carreiras] = await Promise.all([
    loadLookup(supabase, "bancas"),
    loadLookup(supabase, "materias"),
    loadLookup(supabase, "cargos"),
    loadLookup(supabase, "carreiras"),
  ]);

  const questions = records.map((record, index) => {
    const line = index + 2;
    const alternativasRaw = parseJson(record.alternativas, line, "alternativas");
    const alternativas = Array.isArray(alternativasRaw)
      ? alternativasRaw.map((alternative) => ({
          key: String(alternative.key ?? alternative.letra ?? "").trim().toUpperCase(),
          texto: String(alternative.texto ?? "").trim(),
        }))
      : alternativasRaw;
    const justificativaAlternativas = parseJson(
      record.justificativa_alternativas,
      line,
      "justificativa_alternativas",
    );
    const gabarito = record.gabarito.trim().toUpperCase() || null;

    const parsed = questaoSchema.safeParse({
      codigo: record.codigo,
      foco: record.foco,
      tipo: record.tipo,
      estado_prova: record.estado_prova,
      ano: Number(record.ano),
      enunciado: record.enunciado,
      alternativas,
      gabarito,
      justificativa: record.justificativa.trim() || null,
      justificativa_alternativas: justificativaAlternativas,
      ativo: parseBoolean(record.ativo, line),
      peso_dificuldade: Number(record.peso_dificuldade),
      t_ref_segundos: Number(record.t_ref_segundos),
      status_gabarito: record.status_gabarito,
    });

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => issue.message).join("; ");
      throw new Error(`Linha ${line} (${record.codigo || "sem código"}): ${details}`);
    }

    const question = parsed.data;
    if (question.ativo && !["definitivo", "anulada"].includes(question.status_gabarito)) {
      throw new Error(`Linha ${line}: questões ativas precisam de gabarito definitivo ou status anulada.`);
    }
    if (question.ativo && !question.justificativa) {
      throw new Error(`Linha ${line}: questões ativas precisam de comentário original em "justificativa".`);
    }
    if (question.status_gabarito === "anulada") {
      question.gabarito = null;
    } else if (!question.gabarito || !question.alternativas.some(({ key }) => key === question.gabarito)) {
      throw new Error(`Linha ${line}: o gabarito precisa corresponder a uma alternativa existente.`);
    }

    const bancaId = bancas.get(record.banca_slug);
    const materiaId = materias.get(record.materia_slug);
    const cargoId = record.cargo_slug ? cargos.get(record.cargo_slug) : null;
    const carreiraId = record.carreira_slug ? carreiras.get(record.carreira_slug) : null;
    if (!bancaId) throw new Error(`Linha ${line}: banca_slug "${record.banca_slug}" não encontrada.`);
    if (!materiaId) throw new Error(`Linha ${line}: materia_slug "${record.materia_slug}" não encontrada.`);
    if (record.cargo_slug && !cargoId) throw new Error(`Linha ${line}: cargo_slug "${record.cargo_slug}" não encontrado.`);
    if (record.carreira_slug && !carreiraId) {
      throw new Error(`Linha ${line}: carreira_slug "${record.carreira_slug}" não encontrada.`);
    }

    return {
      ...question,
      banca_id: bancaId,
      materia_id: materiaId,
      cargo_id: cargoId,
      carreira_id: carreiraId,
    };
  });

  for (let offset = 0; offset < questions.length; offset += 100) {
    const batch = questions.slice(offset, offset + 100);
    const { error } = await supabase.from("questoes").upsert(batch, { onConflict: "codigo" });
    if (error) {
      throw new Error(`Falha ao importar o lote ${Math.floor(offset / 100) + 1}: ${error.message}`);
    }
  }

  console.log(`${questions.length} questões importadas/atualizadas com sucesso.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falha inesperada na importação.");
  process.exitCode = 1;
});
