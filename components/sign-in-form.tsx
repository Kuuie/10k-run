'use client';

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithEmail } from "@/app/actions";

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
      className="rounded-xl bg-sage px-5 py-3 text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Sending..." : "Send sign-in link"}
    </button>
  );
};

export const SignInForm = () => {
  const [state, formAction] = useActionState(signInWithEmail, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-cream-dark bg-sage-light/30 px-6 py-6 sm:flex-row sm:items-end sm:px-8"
    >
      <div className="flex-1">
        <label className="text-sm font-medium text-olive">
          Work email
        </label>
        <input
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-xl border border-cream-dark bg-cream px-4 py-3 text-base text-olive outline-none ring-sage transition focus:ring-2"
          placeholder="you@company.com"
        />
      </div>
      <SubmitButton />
      {state?.message && (
        <p className="text-sm text-sage-dark">{state.message}</p>
      )}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
};
