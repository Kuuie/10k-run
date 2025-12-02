'use client';

import { SparkleIcon } from "@/components/icons";

export const MicrotransactionButton = () => {
  const onClick = () => {
    alert("Feature pending: payments will reduce the weekly target by 1 km.");
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-pink-500 px-4 py-3 text-xs font-semibold text-white shadow-lg transition hover:bg-pink-400"
    >
      <SparkleIcon className="h-4 w-4" /> Pay $5 to reduce 1 km
    </button>
  );
};
