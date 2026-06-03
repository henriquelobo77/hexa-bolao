// ============================================================
// HEXA · Helpers de data/hora
// Tudo formatado em horário de Brasília (UTC-3, sem horário de verão).
// ============================================================

const TZ = "America/Sao_Paulo";

const dayMonth = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: TZ,
});

const dayMonthLong = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  timeZone: TZ,
});

const weekday = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  timeZone: TZ,
});

const timeShort = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TZ,
});

const dateTimeFull = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TZ,
});

export function fmtDayMonth(iso: string): string {
  return dayMonth.format(new Date(iso)).replace(".", "").toLowerCase();
}

export function fmtDayMonthLong(iso: string): string {
  return dayMonthLong.format(new Date(iso)).toLowerCase();
}

export function fmtWeekday(iso: string): string {
  return weekday.format(new Date(iso)).split("-")[0]; // remove "-feira"
}

export function fmtTime(iso: string): string {
  return timeShort.format(new Date(iso));
}

export function fmtDateTime(iso: string): string {
  return dateTimeFull.format(new Date(iso)).replace(".", "");
}

// Retorna a chave (YYYY-MM-DD) do dia em BR, pra agrupamento
export function dayKeyBR(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const dd = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${dd}`;
}

// Diferença em ms entre um ISO futuro e agora
export function msUntil(iso: string): number {
  return new Date(iso).getTime() - Date.now();
}

// Formata em "23h 46m" ou "12d 4h"
export function fmtCountdown(ms: number): string {
  if (ms <= 0) return "Em jogo";
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin / 60) % 24);
  const mins = totalMin % 60;
  const secs = Math.floor((ms / 1000) % 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m`;
  return `${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
}

// Formata em "23:46:09" (countdown estilo cronômetro)
export function fmtCountdownClock(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const h = String(Math.floor((totalSec / 3600) % 24)).padStart(2, "0");
  const m = String(Math.floor((totalSec / 60) % 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  if (days > 0) return `${days}d ${h}:${m}:${s}`;
  return `${h}:${m}:${s}`;
}
