import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent;
  }
}

export const PWAInstallBanner: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      window.__pwaInstallPrompt = promptEvent;
      setInstallPrompt(promptEvent);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setInstallPrompt(null);
      delete window.__pwaInstallPrompt;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.__pwaInstallPrompt) {
      setInstallPrompt(window.__pwaInstallPrompt);
      setVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (installed || !visible || !installPrompt) return null;

  const install = async () => {
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setVisible(false);
    setInstallPrompt(null);
    delete window.__pwaInstallPrompt;

    if (choice.outcome === 'accepted') setInstalled(true);
  };

  return (
    <div className="mb-4 rounded-2xl border border-indigo-100 bg-white p-3 shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#1A237E]">
          <Smartphone size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800">Installe Savoir+ sur ton téléphone</p>
          <p className="text-xs text-slate-500">Accède à Savoir+ comme une application.</p>
        </div>

        <button
          onClick={install}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#1A237E] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-900 active:scale-95"
        >
          <Download size={15} />
          Installer
        </button>

        <button
          onClick={() => setVisible(false)}
          aria-label="Fermer"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
