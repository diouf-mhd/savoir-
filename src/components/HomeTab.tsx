import React, { useState } from "react";
import { UserProfile, Course, Quiz, PaymentTransaction } from "../types";
import { CONSEIL_DU_JOUR } from "../data/mockData";
import { RenforcementModal } from "./RenforcementModal";
import { PWAInstallBanner } from "./PWAInstallBanner";
import { DomicileModal } from "./DomicileModal";
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  RefreshCw, 
  ArrowRight, 
  Users,
  Home,
  BookmarkCheck
} from "lucide-react";

interface HomeTabProps {
  user: UserProfile;
  courses: Course[];
  quizzes: Quiz[];
  onSelectCourse: (course: Course) => void;
  onNavigateTab: (tab: "cours" | "exercices" | "quiz" | "profil") => void;
  onTriggerSyncWorker: () => void;
  isSyncing: boolean;
  onOpenReceipt?: (tx: PaymentTransaction) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  user,
  courses,
  quizzes,
  onSelectCourse,
  onNavigateTab,
  onTriggerSyncWorker,
  isSyncing,
  onOpenReceipt,
}) => {
  const [conseilIndex] = useState(() => Math.floor(Math.random() * CONSEIL_DU_JOUR.length));

  // Modals for Renforcement and Cours à Domicile
  const [isRenforcementOpen, setIsRenforcementOpen] = useState(false);
  const [isDomicileOpen, setIsDomicileOpen] = useState(false);

  // Recent courses for current user level
  const recentCourses = courses.slice(0, 3);

  return (
    <div className="space-y-5 pb-20">
      <PWAInstallBanner />
      {/* Modals */}
      <RenforcementModal
        isOpen={isRenforcementOpen}
        onClose={() => setIsRenforcementOpen(false)}
        userLevel={user.level}
        userName={user.displayName}
        userUid={user.uid}
        onOpenReceipt={onOpenReceipt}
      />

      <DomicileModal
        isOpen={isDomicileOpen}
        onClose={() => setIsDomicileOpen(false)}
        userLevel={user.level}
        userName={user.displayName}
        userUid={user.uid}
        onOpenReceipt={onOpenReceipt}
      />

      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-[#1A237E] to-indigo-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <GraduationCap size={160} />
        </div>

        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-400/30">
              <Sparkles size={12} />
              <span>Savoir+ Sénégal • Enseignement Secondaire</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Bonjour, {user.displayName.split(" ")[0]} ! 👋
            </h2>
            <p className="text-indigo-200 text-xs mt-1">
              Classe active : <strong className="text-amber-300 font-bold">{user.level}</strong> (Offline-First Room DB)
            </p>
          </div>

          <button
            onClick={onTriggerSyncWorker}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-xl border border-white/20 backdrop-blur-xs transition-all active:scale-95 cursor-pointer"
            title="Exécuter SyncWorker (Firestore -> Room)"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin text-amber-300" : ""} />
            <span className="hidden sm:inline">{isSyncing ? "SyncWorker..." : "Sync Room"}</span>
          </button>
        </div>

        {/* Quick Stats bar */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-indigo-800/80">
          <div className="bg-indigo-950/40 rounded-xl p-2.5 text-center border border-indigo-700/50">
            <span className="block text-xl font-black text-amber-300">{courses.length}</span>
            <span className="text-[10px] text-indigo-200 font-medium uppercase tracking-wider">Cours {user.level}</span>
          </div>

          <div className="bg-indigo-950/40 rounded-xl p-2.5 text-center border border-indigo-700/50">
            <span className="block text-xl font-black text-emerald-300">{quizzes.length}</span>
            <span className="text-[10px] text-indigo-200 font-medium uppercase tracking-wider">Quiz QCM</span>
          </div>

          <div className="bg-indigo-950/40 rounded-xl p-2.5 text-center border border-indigo-700/50">
            <span className="block text-xl font-black text-indigo-200">100%</span>
            <span className="text-[10px] text-indigo-200 font-medium uppercase tracking-wider">Cache Room</span>
          </div>
        </div>
      </div>

      {/* Conseil du Jour Card */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 shadow-xs relative">
        <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm mb-1">
          <BookmarkCheck size={18} className="text-amber-600" />
          <span>Conseil du jour (Massaw Seck)</span>
        </div>
        <p className="text-xs text-amber-950 leading-relaxed italic">
          "{CONSEIL_DU_JOUR[conseilIndex]}"
        </p>
      </div>

      {/* Quick Access Grid - 4 CARDS */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <span>Accès Rapides</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Mes Cours */}
          <button
            onClick={() => onNavigateTab("cours")}
            className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left group flex flex-col justify-between h-28 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#1A237E] flex items-center justify-center font-bold group-hover:bg-[#1A237E] group-hover:text-white transition-colors">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-[#1A237E] leading-tight">
                Mes Cours
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                Filtrés pour la {user.level}
              </p>
            </div>
          </button>

          {/* Card 2: Quiz QCM */}
          <button
            onClick={() => onNavigateTab("quiz")}
            className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all text-left group flex flex-col justify-between h-28 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <HelpCircle size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-emerald-700 leading-tight">
                Quiz QCM
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                Testez vos connaissances
              </p>
            </div>
          </button>

          {/* Card 3: Renforcements */}
          <button
            onClick={() => setIsRenforcementOpen(true)}
            className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all text-left group flex flex-col justify-between h-28 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Users size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-amber-800 leading-tight">
                Renforcements
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                Au centre de l'encadreur
              </p>
            </div>
          </button>

          {/* Card 4: Cours à Domicile */}
          <button
            onClick={() => setIsDomicileOpen(true)}
            className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all text-left group flex flex-col justify-between h-28 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Home size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-rose-800 leading-tight">
                Cours à Domicile
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                Suivi individuel chez l'élève
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Derniers Cours au programme */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Derniers Cours ({user.level})
          </h3>
          <button
            onClick={() => onNavigateTab("cours")}
            className="text-xs font-semibold text-[#1A237E] hover:underline flex items-center space-x-1"
          >
            <span>Tout voir</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentCourses.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200">
            <p className="text-xs text-slate-500">Aucun cours trouvé dans le cache Room local pour la {user.level}.</p>
            <button
              onClick={onTriggerSyncWorker}
              className="mt-3 text-xs bg-[#1A237E] text-white px-3 py-1.5 rounded-lg font-medium"
            >
              Exécuter SyncWorker
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => onSelectCourse(course)}
                className="bg-white rounded-2xl p-3.5 border border-slate-200 hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-[#1A237E] font-bold text-[10px] rounded-md border border-indigo-100">
                      {course.subject}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {course.chapter}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1">
                    {course.title}
                  </h4>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
