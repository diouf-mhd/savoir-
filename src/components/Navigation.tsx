import React from "react";
import { Home, BookOpen, FileText, HelpCircle, User } from "lucide-react";

export type NavTab = "accueil" | "cours" | "exercices" | "quiz" | "profil";

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userLevel: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  userLevel,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: "accueil",
      label: "Accueil",
      icon: <Home size={20} />,
    },
    {
      id: "cours",
      label: "Cours",
      icon: <BookOpen size={20} />,
      badge: userLevel,
    },
    {
      id: "exercices",
      label: "Exercices",
      icon: <FileText size={20} />,
    },
    {
      id: "quiz",
      label: "Quiz QCM",
      icon: <HelpCircle size={20} />,
    },
    {
      id: "profil",
      label: "Profil",
      icon: <User size={20} />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-30">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "text-[#1A237E] font-bold"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive ? "bg-indigo-50 text-[#1A237E] scale-110" : ""
                  }`}
                >
                  {tab.icon}
                </div>
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <div className="w-4 h-1 bg-[#1A237E] rounded-full mt-0.5"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
