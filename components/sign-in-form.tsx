'use client';

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithEmail, signInWithPassword, signUpWithPassword } from "@/app/actions";

type State = {
  message?: string;
  error?: string;
};

const initialState: State = {};

type AuthMode = "magic-link" | "password" | "sign-up";

const SubmitButton = ({ label, pendingLabel }: { label: string; pendingLabel: string }) => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-sage px-5 py-3 text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
};

const TabButton = ({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
      active
        ? "bg-sage text-white"
        : "text-olive hover:bg-sage-light/50"
    }`}
  >
    {children}
  </button>
);

export const SignInForm = () => {
  const [mode, setMode] = useState<AuthMode>("magic-link");
  const [magicLinkState, magicLinkAction] = useActionState(signInWithEmail, initialState);
  const [passwordState, passwordAction] = useActionState(signInWithPassword, initialState);
  const [signUpState, signUpAction] = useActionState(signUpWithPassword, initialState);

  const currentState = mode === "magic-link" ? magicLinkState : mode === "password" ? passwordState : signUpState;

  return (
    <div className="rounded-2xl border border-cream-dark bg-sage-light/30 px-6 py-6 sm:px-8">
      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 rounded-xl bg-cream-dark/50 p-1">
        <TabButton active={mode === "magic-link"} onClick={() => setMode("magic-link")}>
          Magic Link
        </TabButton>
        <TabButton active={mode === "password"} onClick={() => setMode("password")}>
          Password
        </TabButton>
        <TabButton active={mode === "sign-up"} onClick={() => setMode("sign-up")}>
          Sign Up
        </TabButton>
      </div>

      {/* Magic Link Form */}
      {mode === "magic-link" && (
        <form action={magicLinkAction} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-olive">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-cream-dark bg-cream px-4 py-3 text-base text-olive outline-none ring-sage transition focus:ring-2"
              placeholder="you@company.com"
            />
          </div>
          <SubmitButton label="Send sign-in link" pendingLabel="Sending..." />
          <p className="text-center text-xs text-olive/70">
            We'll email you a magic link for password-free sign in.
          </p>
        </form>
      )}

      {/* Password Login Form */}
      {mode === "password" && (
        <form action={passwordAction} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-olive">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-cream-dark bg-cream px-4 py-3 text-base text-olive outline-none ring-sage transition focus:ring-2"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-olive">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-2 w-full rounded-xl border border-cream-dark bg-cream px-4 py-3 text-base text-olive outline-none ring-sage transition focus:ring-2"
              placeholder="••••••••"
            />
          </div>
          <SubmitButton label="Sign in" pendingLabel="Signing in..." />
        </form>
      )}

      {/* Sign Up Form */}
      {mode === "sign-up" && (
        <form action={signUpAction} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-olive">Name</label>
            <input
              name="name"
              type="text"
              className="mt-2 w-full rounded-xl border border-cream-dark bg-cream px-4 py-3 text-base text-olive outline-none ring-sage transition focus:ring-2"
              placeholder="Your name (optional)"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-olive">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-cream-dark bg-cream px-4 py-3 text-base text-olive outline-none ring-sage transition focus:ring-2"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-olive">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-2 w-full rounded-xl border border-cream-dark bg-cream px-4 py-3 text-base text-olive outline-none ring-sage transition focus:ring-2"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-olive/60">Minimum 6 characters</p>
          </div>
          <SubmitButton label="Create account" pendingLabel="Creating account..." />
          <p className="text-center text-xs text-olive/70">
            You'll receive an email to confirm your account.
          </p>
        </form>
      )}

      {/* Status Messages */}
      {currentState?.message && (
        <p className="mt-4 rounded-lg bg-sage/10 p-3 text-center text-sm text-sage-dark">
          {currentState.message}
        </p>
      )}
      {currentState?.error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
          {currentState.error}
        </p>
      )}
    </div>
  );
};
