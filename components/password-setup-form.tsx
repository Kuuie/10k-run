'use client';

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePasswordAction } from "@/app/actions";

type State = {
  message?: string;
  error?: string;
};

const initialState: State = {};

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-sage px-5 py-2 text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Set password"}
    </button>
  );
};

export function PasswordSetupForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="flex flex-col gap-2 text-sm font-medium text-olive">
          New password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            className="rounded-xl border border-cream-dark bg-background px-4 py-3 text-base text-olive"
          />
        </label>
        <p className="mt-1 text-xs text-olive/60">Minimum 6 characters</p>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium text-olive">
        Confirm password
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          placeholder="••••••••"
          className="rounded-xl border border-cream-dark bg-background px-4 py-3 text-base text-olive"
        />
      </label>
      <SubmitButton />
      {state?.message && (
        <p className="rounded-lg bg-sage/10 p-3 text-sm text-sage-dark">
          {state.message}
        </p>
      )}
      {state?.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
