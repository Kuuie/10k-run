'use client';

import { useFormStatus } from "react-dom";
import { clsx } from "clsx";

type PendingButtonProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
};

export const PendingButton = ({
  label,
  pendingLabel = "Saving...",
  className,
}: PendingButtonProps) => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        "rounded-xl bg-indigo-600 px-5 py-2.5 text-white transition hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
    >
      {pending ? pendingLabel : label}
    </button>
  );
};
