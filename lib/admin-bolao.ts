import "server-only";
import { supabaseAdmin } from "./supabase";
import { getActiveBolaoId } from "./session";
import type { Bolao } from "./types";

// Resolve o bolão ativo (cookie) ou cai no primeiro do banco.
// Usado por todas as páginas de /admin/...
export async function getCurrentAdminBolao(): Promise<Bolao | null> {
  const admin = supabaseAdmin();
  const activeId = await getActiveBolaoId();

  if (activeId) {
    const { data } = await admin
      .from("bolao")
      .select("*")
      .eq("id", activeId)
      .maybeSingle<Bolao>();
    if (data) return data;
  }

  // Fallback: primeiro bolão criado
  const { data } = await admin
    .from("bolao")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<Bolao>();
  return data;
}

export async function listAllBoloes(): Promise<Bolao[]> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("bolao")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<Bolao[]>();
  return data ?? [];
}
