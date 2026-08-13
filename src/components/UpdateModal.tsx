import React from "react";
import { Download, Sparkles, X, ShieldAlert, ArrowUpRight } from "lucide-react";
import { appLogo } from "../utils/assetImages";

interface UpdateModalProps {
  isOpen: boolean;
  latestVersion: string;
  currentVersion: string;
  apkUrl: string;
  message?: string;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  latestVersion,
  currentVersion,
  apkUrl,
  message,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleUpdate = () => {
    if (apkUrl) {
      window.open(apkUrl, "_blank");
    } else {
      alert("Le lien de téléchargement direct de l'APK n'est pas encore configuré par l'administration.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-400 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden space-y-5 transform transition-all scale-100">
        
        {/* Top Decorative Gradient Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-[#1A237E]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Fermer (Plus tard)"
        >
          <X size={20} />
        </button>

        {/* Header Icon Branding */}
        <div className="text-center space-y-3 pt-2">
          <div className="relative inline-block">
            <img
              src={appLogo}
              alt="Savoir+ Sénégal Logo"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md mx-auto bg-white"
            />
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-[#1A237E] p-1 rounded-full shadow-md">
              <Sparkles size={16} className="animate-pulse" />
            </span>
          </div>

          <div>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100 text-[#1A237E] text-xs font-black rounded-full border border-amber-300">
              <Sparkles size={12} />
              <span>Version {latestVersion} disponible !</span>
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
              Mise à jour disponible !
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Savoir+ Sénégal • Version actuelle v{currentVersion} → v{latestVersion}
            </p>
          </div>
        </div>

        {/* Message Body */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            {message || "Une nouvelle version de l'application Savoir+ est disponible avec de superbes améliorations."}
          </p>
        </div>

        {/* Actions Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center"
          >
            Plus tard
          </button>

          <button
            type="button"
            onClick={handleUpdate}
            className="py-3 px-4 bg-gradient-to-r from-[#1A237E] to-indigo-800 hover:from-indigo-900 hover:to-[#1A237E] text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-900/20 hover:shadow-xl transition-all cursor-pointer text-center flex items-center justify-center space-x-2 border border-amber-400/40"
          >
            <Download size={16} className="animate-bounce" />
            <span>Mettre à jour</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
