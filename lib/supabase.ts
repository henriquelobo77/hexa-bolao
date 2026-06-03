// ============================================================
// HEXA · Supabase clients
// ------------------------------------------------------------
// Três clientes:
//   - browser:  para Client Components (anon key, sujeito a RLS)
//   - server:   para Server Components / Server Actions (anon key + cookies)
//   - admin:    para Server Actions privilegiadas (service_role, ignora RLS)
// ============================================================

import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !anonKey) {
  // Falha cedo em dev se as envs estiverem faltando
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes. Configure .env.local."
  );
}

// ------------------------------------------------------------
// (Browser client foi movido pra ./supabase-browser.ts —
//  esse arquivo é server-only e importa next/headers)
// ------------------------------------------------------------

// ------------------------------------------------------------
// Server (Server Components / Server Actions, com cookies)
// ------------------------------------------------------------
// Fetch que opta por NÃO usar o cache de Data do Next.
// Sem isso, GETs do supabase-js entram no cache do Next mesmo com
// `dynamic = "force-dynamic"` e router.refresh() não vê dado novo.
const noCacheFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Chamado a partir de um Server Component — sem efeito, ignora.
        }
      },
    },
    global: { fetch: noCacheFetch },
  });
}

// ------------------------------------------------------------
// Admin (service_role — IGNORA RLS, use só em Server Actions
// validadas)
// ------------------------------------------------------------
let _admin: ReturnType<typeof createClient<Database>> | null = null;
export function supabaseAdmin() {
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente — escrita bloqueada.");
  }
  if (!_admin) {
    _admin = createClient<Database>(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: noCacheFetch },
    });
  }
  return _admin;
}
