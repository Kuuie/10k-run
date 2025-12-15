"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  isConnected: boolean;
  connectedAt?: string;
  onDisconnect: () => Promise<unknown>;
};

export function StravaConnectButton({ isConnected, connectedAt, onDisconnect }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await onDisconnect();
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FC4C02]/10">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#FC4C02">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-olive">Connected to Strava</p>
            {connectedAt && (
              <p className="text-xs text-olive/60">
                Since {new Date(connectedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={isLoading}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
        >
          {isLoading ? "..." : "Disconnect"}
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/api/strava/connect"
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FC4C02] px-5 py-3 text-white transition hover:bg-[#E34402]"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
      </svg>
      Connect with Strava
    </Link>
  );
}
