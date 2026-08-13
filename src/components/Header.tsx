import React from "react";
import { UserProfile } from "../types";
import { ShieldCheck, Wifi, WifiOff, Code2, GraduationCap, Bell, RefreshCw } from "lucide-react";
import { appLogo } from "../utils/assetImages";

interface HeaderProps {
  user: UserProfile;
  isOfflineMode: boolean;
  onToggleOffline: () => void;
  onOpenCodeViewer: () => void;
  isCodeViewerOpen: boolean;
  unreadNotifCount?: number;
  onOpenNotifications?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isOfflineMode,
  onToggleOffline,
  onOpenCodeViewer,
  isCodeViewerOpen,
  unreadNotifCount = 0,
  onOpenNotifications,
  isSyncing = false,
}) => {
  return (
    <header className="bg-[#1A237E] text-white shadow-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-2.5">
              <img 
                src={appLogo} 
                alt="Savoir+ Sénégal Logo" 
                className="w-10 h-10 rounded-xl object-cover border-2 border-amber-300 shadow-md bg-white shrink-0" 
                referrerPolicy="no-referrer" 
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">Savoir+</h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                    Sénégal
                  </span>
                </div>
                <p className="text-xs text-indigo-200">6ème à Terminale • Offline-First</p>
              </div>
            </div>

            {/* Mobile Header Actions */}
            <div className="flex sm:hidden items-center space-x-1.5">
              {/* Mobile Notification Bell */}
              {onOpenNotifications && (
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-lg text-xs font-medium bg-indigo-800/80 text-amber-300 border border-indigo-700 hover:bg-indigo-700 cursor-pointer"
                  title="Notifications & Suivi des paiements"
                >
                  <Bell size={18} />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={onToggleOffline}
                className={`p-2 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors ${
                  isOfflineMode
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}
                title="Basculer le mode hors-ligne"
              >
                {isOfflineMode ? <WifiOff size={16} /> : <Wifi size={16} />}
              </button>
              
              <button
                onClick={onOpenCodeViewer}
                className={`p-2 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors ${
                  isCodeViewerOpen
                    ? "bg-amber-400 text-[#1A237E]"
                    : "bg-indigo-800/80 text-indigo-100 hover:bg-indigo-700"
                }`}
                title="Code Kotlin Native"
              >
                <Code2 size={16} />
              </button>
            </div>
          </div>

          {/* User Status & Controls */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Desktop Notification Bell */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-700 text-amber-300 transition-all cursor-pointer flex items-center justify-center"
                title="Notifications de paiements Wave / OM"
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            )}

            {/* Background Syncing Indicator */}
            {isSyncing && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-lg text-xs animate-pulse">
                <RefreshCw size={13} className="animate-spin text-amber-300" />
                <span className="font-medium text-[11px]">Sync Firestore...</span>
              </div>
            )}

            {/* FLAG_SECURE Indicator */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-indigo-900/60 rounded-lg text-xs border border-indigo-700 text-indigo-200">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>FLAG_SECURE Actif</span>
            </div>

            {/* Offline Mode Switch */}
            <button
              onClick={onToggleOffline}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                isOfflineMode
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
              }`}
            >
              {isOfflineMode ? (
                <>
                  <WifiOff size={14} />
                  <span>Mode Cache Room (Hors-ligne)</span>
                </>
              ) : (
                <>
                  <Wifi size={14} />
                  <span>En ligne (Sync Firestore)</span>
                </>
              )}
            </button>

            {/* Code Viewer Button */}
            <button
              onClick={onOpenCodeViewer}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                isCodeViewerOpen
                  ? "bg-amber-400 text-[#1A237E] shadow"
                  : "bg-indigo-800/80 text-indigo-100 hover:bg-indigo-700 border border-indigo-600"
              }`}
            >
              <Code2 size={14} />
              <span>Code Kotlin</span>
            </button>

            {/* User Level Badge */}
            <div className="flex items-center space-x-2 pl-2 border-l border-indigo-800">
              <div className="text-right">
                <p className="text-xs font-semibold text-white leading-tight">{user.displayName}</p>
                <div className="flex items-center justify-end space-x-1">
                  <GraduationCap size={12} className="text-amber-400" />
                  <span className="text-[11px] font-bold text-amber-300">{user.level}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

