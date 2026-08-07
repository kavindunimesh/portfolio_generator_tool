import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'adawwa-install-dismissed';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    ('standalone' in navigator && Boolean((navigator as { standalone?: boolean }).standalone))
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1' || isStandalone();
    } catch {
      return isStandalone();
    }
  });

  useEffect(() => {
    if (isStandalone()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    // iOS never fires beforeinstallprompt — show Add to Home Screen tip once
    if (isIos()) {
      setShowIosHint(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  if (hidden) return null;
  if (!deferred && !showIosHint) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
    setHidden(true);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === 'accepted') setHidden(true);
  };

  return (
    <div className="install-banner" role="region" aria-label="Install Adawwa">
      <div className="install-banner-copy">
        <strong>Install Adawwa</strong>
        <p>
          {deferred
            ? 'Add to your home screen for quick access — works like an app.'
            : 'On iPhone: tap Share, then “Add to Home Screen”.'}
        </p>
      </div>
      <div className="install-banner-actions">
        {deferred && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void install()}>
            Install
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
