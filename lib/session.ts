// ============================================================
// HEXA · Sessão (cookies)
// ------------------------------------------------------------
// Sem auth tradicional — usamos cookies pra lembrar:
//   - hexa_member: id do membro logado no bolão
//   - hexa_admin:  marcador de admin autenticado (true/false)
// ============================================================

import { cookies } from "next/headers";

const MEMBER_COOKIE = "hexa_member";
const ADMIN_COOKIE = "hexa_admin";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 dias

export async function getMemberId(): Promise<string | null> {
  const c = await cookies();
  return c.get(MEMBER_COOKIE)?.value ?? null;
}

export async function setMemberId(id: string): Promise<void> {
  const c = await cookies();
  c.set(MEMBER_COOKIE, id, {
    maxAge: MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearMemberId(): Promise<void> {
  const c = await cookies();
  c.delete(MEMBER_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  return c.get(ADMIN_COOKIE)?.value === "1";
}

export async function setAdmin(): Promise<void> {
  const c = await cookies();
  c.set(ADMIN_COOKIE, "1", {
    maxAge: 60 * 60 * 8, // 8h
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdmin(): Promise<void> {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
}

// ------------------------------------------------------------
// Bolão ativo do admin (qual bolão ele tá gerenciando)
// ------------------------------------------------------------

const ACTIVE_BOLAO_COOKIE = "hexa_active_bolao";

export async function getActiveBolaoId(): Promise<string | null> {
  const c = await cookies();
  return c.get(ACTIVE_BOLAO_COOKIE)?.value ?? null;
}

export async function setActiveBolaoId(id: string): Promise<void> {
  const c = await cookies();
  c.set(ACTIVE_BOLAO_COOKIE, id, {
    maxAge: 60 * 60 * 8, // mesma duração da sessão admin
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearActiveBolaoId(): Promise<void> {
  const c = await cookies();
  c.delete(ACTIVE_BOLAO_COOKIE);
}
