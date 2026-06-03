"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginToBolao, signupToBolao, type AuthResult } from "@/lib/actions/member";

type Mode = "login" | "signup";

async function loginAction(_prev: AuthResult | null, formData: FormData) {
  return loginToBolao(formData);
}
async function signupAction(_prev: AuthResult | null, formData: FormData) {
  return signupToBolao(formData);
}

interface JoinFormProps {
  presetCode?: string;
}

export function JoinForm({ presetCode = "HEXA2026" }: JoinFormProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [loginState, loginFormAction, loginPending] = useActionState<AuthResult | null, FormData>(
    loginAction,
    null
  );
  const [signupState, signupFormAction, signupPending] = useActionState<AuthResult | null, FormData>(
    signupAction,
    null
  );
  const router = useRouter();
  const state = mode === "login" ? loginState : signupState;
  const pending = mode === "login" ? loginPending : signupPending;

  useEffect(() => {
    if (state?.ok) {
      router.push(`/b/${state.bolaoSlug}`);
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-0 border-b border-rule">
        <TabButton active={mode === "login"} onClick={() => setMode("login")}>
          Entrar
        </TabButton>
        <TabButton active={mode === "signup"} onClick={() => setMode("signup")}>
          Criar conta
        </TabButton>
      </div>

      {mode === "login" ? (
        <LoginForm
          formAction={loginFormAction}
          pending={loginPending}
          state={loginState}
          presetCode={presetCode}
          onSwitchToSignup={() => setMode("signup")}
        />
      ) : (
        <SignupForm
          formAction={signupFormAction}
          pending={signupPending}
          state={signupState}
          presetCode={presetCode}
          onSwitchToLogin={() => setMode("login")}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-4 py-3 font-display text-base font-extrabold uppercase tracking-wider transition-colors relative ${
        active ? "text-acid" : "text-bone-muted hover:text-bone"
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-acid" />
      )}
    </button>
  );
}

// ============================================================
// Login
// ============================================================
function LoginForm({
  formAction,
  pending,
  state,
  presetCode,
  onSwitchToSignup,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  state: AuthResult | null;
  presetCode: string;
  onSwitchToSignup: () => void;
}) {
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Código do bolão" name="code" type="text" defaultValue={presetCode} mono uppercase />
      <Field label="Seu apelido" name="nickname" type="text" placeholder="Como a galera te conhece" />
      <Field
        label="Seu PIN"
        name="pin"
        type="password"
        pattern="\d{4,6}"
        minLength={4}
        maxLength={6}
        inputMode="numeric"
        placeholder="4 a 6 dígitos"
        mono
        tracked
      />

      {state && !state.ok && (
        <div className="text-warning text-xs font-mono uppercase tracking-wide leading-snug">
          ↳ {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-pitch border border-acid text-acid font-display text-xl font-extrabold uppercase tracking-wider py-4 hover:bg-acid hover:text-black transition disabled:opacity-50"
      >
        {pending ? "Entrando..." : "Entrar →"}
      </button>

      <button
        type="button"
        onClick={onSwitchToSignup}
        className="text-[11px] font-mono uppercase tracking-[0.16em] text-bone-muted hover:text-acid text-center pt-1"
      >
        ↳ é sua primeira vez? criar conta
      </button>
    </form>
  );
}

// ============================================================
// Signup
// ============================================================
function SignupForm({
  formAction,
  pending,
  state,
  presetCode,
  onSwitchToLogin,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  state: AuthResult | null;
  presetCode: string;
  onSwitchToLogin: () => void;
}) {
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Código do bolão" name="code" type="text" defaultValue={presetCode} mono uppercase />
      <Field
        label="Escolha seu apelido"
        name="nickname"
        type="text"
        placeholder="Único no bolão"
        helper="Não dá pra repetir um apelido que já existe"
      />
      <Field
        label="Crie um PIN"
        name="pin"
        type="password"
        pattern="\d{4,6}"
        minLength={4}
        maxLength={6}
        inputMode="numeric"
        placeholder="4 a 6 dígitos"
        mono
        tracked
        helper="Vai precisar dele pra entrar em outro device"
      />
      <Field
        label="Confirme o PIN"
        name="pin_confirm"
        type="password"
        pattern="\d{4,6}"
        minLength={4}
        maxLength={6}
        inputMode="numeric"
        placeholder="Mesma sequência"
        mono
        tracked
      />

      {state && !state.ok && (
        <div className="text-warning text-xs font-mono uppercase tracking-wide leading-snug">
          ↳ {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-pitch border border-acid text-acid font-display text-xl font-extrabold uppercase tracking-wider py-4 hover:bg-acid hover:text-black transition disabled:opacity-50"
      >
        {pending ? "Criando..." : "Criar conta →"}
      </button>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="text-[11px] font-mono uppercase tracking-[0.16em] text-bone-muted hover:text-acid text-center pt-1"
      >
        ↳ já tem conta? entrar
      </button>
    </form>
  );
}

// ============================================================
// Field reutilizável
// ============================================================
function Field({
  label,
  name,
  type,
  defaultValue,
  placeholder,
  pattern,
  minLength,
  maxLength,
  inputMode,
  mono,
  uppercase,
  tracked,
  helper,
}: {
  label: string;
  name: string;
  type: string;
  defaultValue?: string;
  placeholder?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  inputMode?: "numeric" | "text";
  mono?: boolean;
  uppercase?: boolean;
  tracked?: boolean;
  helper?: string;
}) {
  const fontClass = [
    mono ? "font-mono" : "",
    uppercase ? "uppercase tracking-[0.18em]" : "",
    tracked ? "tracking-[0.5em]" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[10px] font-mono uppercase tracking-[0.2em] text-bone-muted mb-2"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        pattern={pattern}
        minLength={minLength}
        maxLength={maxLength ?? 64}
        inputMode={inputMode}
        autoComplete="off"
        autoCapitalize={uppercase ? "characters" : "off"}
        spellCheck={false}
        required
        className={`w-full bg-graphite border border-rule px-4 py-4 text-bone text-lg focus:border-acid focus:outline-none transition-colors placeholder:text-bone-faint placeholder:tracking-normal ${fontClass}`}
      />
      {helper && (
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-bone-faint mt-1.5 leading-tight">
          ↳ {helper}
        </p>
      )}
    </div>
  );
}
