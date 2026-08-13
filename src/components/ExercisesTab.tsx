import React, { useState } from "react";
import { Asset, SecondaryLevel, Subject } from "../types";
import { ALL_LEVELS, getSubjectsForLevel } from "../data/mockData";
import { DocumentViewerModal } from "./DocumentViewerModal";
import { EditAssetModal } from "./EditAssetModal";
import { RoomDatabaseRepository } from "../data/roomStorage";
import { 
  FileText, 
  Download, 
  CheckCircle, 
  HardDrive, 
  Search, 
  Eye, 
  X, 
  Sparkles,
  FileCheck,
  Edit3,
  Trash2,
  Filter
} from "lucide-react";

interface ExercisesTabProps {
  userLevel: SecondaryLevel;
  assets: Asset[];
  onToggleCacheAsset: (assetId: string) => void;
  isAdmin?: boolean;
}

export const ExercisesTab: React.FC<ExercisesTabProps> = ({
  userLevel,
  assets,
  onToggleCacheAsset,
  isAdmin,
}) => {
  const roomRepo = RoomDatabaseRepository.getInstance();

  const [adminLevel, setAdminLevel] = useState<SecondaryLevel>(userLevel);
  const activeLevel = isAdmin ? adminLevel : userLevel;

  const availableSubjects = getSubjectsForLevel(activeLevel);
  const [selectedSubject, setSelectedSubject] = useState<Subject | "Tous">("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const handleDeleteAsset = (asset: Asset) => {
    roomRepo.deleteAsset(asset.assetId);
  };

  const allCourses = roomRepo.getAllCourses();
  const allAssets = roomRepo.getAllAssets();
  const currentAssets = isAdmin ? allAssets : assets;

  const filteredAssets = currentAssets.filter((a) => {
    // Level determination
    const assetLevel = a.level || (allCourses.find(c => c.id === a.parentId)?.level);
    const matchesLevel = !assetLevel || assetLevel === activeLevel;
    const matchesAllowedSubject = !a.subject || availableSubjects.includes(a.subject);
    const matchesSubject = selectedSubject === "Tous" || a.subject === selectedSubject;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.storagePath.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesAllowedSubject && matchesSubject && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-xs font-black shadow-xs">
                <span>Exercices de {activeLevel}</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
                <HardDrive size={12} />
                <span>Cache Room</span>
              </span>
            </div>
            <h2 className="text-lg font-bold">Fichiers & Sujets d'Exercices ({activeLevel})</h2>
            <p className="text-emerald-100 text-xs">
              {isAdmin ? "Accès Administrateur : Consultation et gestion de tous les dossiers." : `Seuls les élèves de ${activeLevel} accèdent à ces sujets et fiches de révision.`}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {isAdmin && (
              <select
                value={adminLevel}
                onChange={(e) => {
                  setAdminLevel(e.target.value as SecondaryLevel);
                  setSelectedSubject("Tous");
                }}
                className="bg-white border-2 border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-extrabold text-emerald-900 shadow-xs cursor-pointer"
              >
                {ALL_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>Classe de {lvl}</option>
                ))}
              </select>
            )}
            <div className="bg-emerald-950/60 p-3 rounded-2xl border border-emerald-700/60 text-center flex-shrink-0">
              <span className="block text-xl font-black text-amber-300">{filteredAssets.length}</span>
              <span className="text-[9px] text-emerald-200 font-medium uppercase">Sujets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher un sujet BFEM, BAC, fiche TP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 placeholder-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Subject Filter Chips */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
          <Filter size={12} />
          <span>Filtre par Matières :</span>
        </p>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedSubject("Tous")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedSubject === "Tous"
                ? "bg-emerald-800 text-white shadow"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Toutes les matières
          </button>

          {availableSubjects.map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedSubject === subj
                  ? "bg-emerald-800 text-white shadow"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Asset List */}
      <div className="space-y-2.5">
        {filteredAssets.map((asset) => (
          <div
            key={asset.assetId}
            className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div
                className={`w-11 h-11 rounded-2xl font-black text-xs flex items-center justify-center uppercase shadow-inner flex-shrink-0 ${
                  asset.type === "pdf"
                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                    : asset.type === "docx"
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-amber-100 text-amber-700 border border-amber-200"
                }`}
              >
                {asset.type}
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {asset.name}
                  </h3>
                  {asset.subject && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md flex-shrink-0">
                      {asset.subject}
                    </span>
                  )}
                  {asset.level && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-extrabold rounded-md flex-shrink-0">
                      {asset.level}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 flex items-center space-x-2">
                  <span>Taille : {asset.size}</span>
                  <span>•</span>
                  <span className="truncate font-mono text-[10px] text-slate-400">
                    {asset.storagePath}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {isAdmin && (
                <div className="flex items-center space-x-1.5 bg-amber-50 p-1 rounded-xl border border-amber-200">
                  <button
                    type="button"
                    onClick={() => setEditingAsset(asset)}
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-lg flex items-center space-x-1 transition-colors shadow-xs cursor-pointer"
                    title="Modifier ce document / exercice"
                  >
                    <Edit3 size={14} />
                    <span className="hidden sm:inline">Modifier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAsset(asset)}
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg flex items-center space-x-1 transition-colors shadow-xs cursor-pointer"
                    title="Supprimer ce document"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Supprimer</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => setPreviewAsset(asset)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Consulter et lire le document"
              >
                <Eye size={16} />
                <span>Ouvrir</span>
              </button>

              <button
                onClick={() => onToggleCacheAsset(asset.assetId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  asset.isCachedOffline
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {asset.isCachedOffline ? (
                  <>
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span>En cache</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Mettre en cache</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
        asset={previewAsset}
        title={previewAsset?.name}
        onToggleCacheAsset={onToggleCacheAsset}
      />

      {/* Admin Edit Asset Modal */}
      <EditAssetModal
        asset={editingAsset}
        isOpen={Boolean(editingAsset)}
        onClose={() => setEditingAsset(null)}
      />
    </div>
  );
};
