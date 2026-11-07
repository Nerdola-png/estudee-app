import { createClient } from "@supabase/supabase-js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function main() {
  const [userId, daysText, operatorId] = process.argv.slice(2);
  const days = Number(daysText);
  if (!uuidPattern.test(userId ?? "") || !uuidPattern.test(operatorId ?? "")) {
    throw new Error("Uso: npm run pix:ativar -- <user_id> <dias> <operador_id>");
  }
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error("O período deve ser um número inteiro entre 1 e 365 dias.");
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Defina SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc("registrar_assinatura_pix_manual", {
    p_user_id: userId,
    p_periodo_dias: days,
    p_ativado_por: operatorId,
  });
  if (error) throw new Error(`Não foi possível registrar a ativação: ${error.message}`);

  console.log(`Pix registrado. Assinatura: ${data}. Período Premium: ${days} dias.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falha inesperada ao registrar Pix.");
  process.exitCode = 1;
});
