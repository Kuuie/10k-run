'use client';

import { useState, useEffect } from 'react';

type InstallPromptProps = {
  className?: string;
};

export function InstallPrompt({ className = '' }: InstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    if (isStandalone) {
      setShowPrompt(false);
      return;
    }

    // Check if previously dismissed
    const wasDismissed = localStorage.getItem('install-prompt-dismissed');
    if (wasDismissed) {
      const dismissedAt = parseInt(wasDismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
        setShowPrompt(false);
        return;
      }
    }

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setShowPrompt(isIOSDevice || isAndroidDevice);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt || dismissed) return null;

  return (
    <div className={`rounded-2xl border border-sage/30 bg-sage-light/50 p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage text-white">
            <span className="material-icons-round text-xl">download</span>
          </div>
          <div>
            <h3 className="font-semibold text-olive">Install the App</h3>
            <p className="mt-1 text-sm text-olive/70">
              Add 10K Challenge to your home screen for quick access.
            </p>

            {isIOS && (
              <div className="mt-3 space-y-2 text-sm text-olive/80">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage/20 text-xs font-bold text-sage-dark">1</span>
                  <span>Tap the <span className="inline-flex items-center gap-1 rounded bg-cream-dark px-1.5 py-0.5 font-medium"><span className="material-icons-round text-sm">ios_share</span> Share</span> button</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage/20 text-xs font-bold text-sage-dark">2</span>
                  <span>Scroll and tap <span className="rounded bg-cream-dark px-1.5 py-0.5 font-medium">Add to Home Screen</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage/20 text-xs font-bold text-sage-dark">3</span>
                  <span>Tap <span className="rounded bg-cream-dark px-1.5 py-0.5 font-medium">Add</span></span>
                </div>
              </div>
            )}

            {isAndroid && (
              <div className="mt-3 space-y-2 text-sm text-olive/80">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage/20 text-xs font-bold text-sage-dark">1</span>
                  <span>Tap the <span className="inline-flex items-center gap-1 rounded bg-cream-dark px-1.5 py-0.5 font-medium"><span className="material-icons-round text-sm">more_vert</span> Menu</span> button</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage/20 text-xs font-bold text-sage-dark">2</span>
                  <span>Tap <span className="rounded bg-cream-dark px-1.5 py-0.5 font-medium">Install app</span> or <span className="rounded bg-cream-dark px-1.5 py-0.5 font-medium">Add to Home Screen</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage/20 text-xs font-bold text-sage-dark">3</span>
                  <span>Tap <span className="rounded bg-cream-dark px-1.5 py-0.5 font-medium">Install</span></span>
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-full p-1 text-olive/50 hover:bg-cream-dark hover:text-olive"
          aria-label="Dismiss"
        >
          <span className="material-icons-round text-xl">close</span>
        </button>
      </div>
    </div>
  );
}
