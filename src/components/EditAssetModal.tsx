import React, { useState, useEffect } from "react";
import { Asset, SecondaryLevel, Subject, Course } from "../types";
import { ALL_LEVELS, getSubjectsForLevel } from "../data/mockData";
import { RoomDatabaseRepository } from "../data/roomStorage";
import { FileText, X, Edit3, Save, Trash2 } from "lucide-react";

interface EditAssetModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditAssetModal: React.FC<EditAssetModalProps> = ({
  asset,
  isOpen,
  onClose,
}) => {
  const roomRepo = RoomDatabaseRepository.getInstance();

  const [name, setName] = useState("");
  const [level, setLevel] = useState<SecondaryLevel>("3ème");
  const [subject, setSubject] = useState<Subject>("Maths");
  const [type, setType] = useState<"pdf" | "video" | "image">("pdf");
  const [size, setSize] = useState("1.5 MB");
  const [storagePath, setStoragePath] = useState("");
  const [parentId, setParentId] = useState("");

  const [allCourses, setAllCourses] = useState<Course[]>([]);

  useEffect(() => {
    setAllCourses(roomRepo.getAllCourses());
  }, [isOpen]);

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setLevel(asset.level);
      setSubject(asset.subject);
      setType(asset.type);
      setSize(asset.size);
      setStoragePath(asset.storagePath);
      setParentId(asset.parentId || "");
    }
  }, [asset]);

  if (!isOpen || !asset) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedAsset: Asset = {
      ...asset,
      name,
      level,
      subject,
      type,
      size,
      storagePath,
      parentId: parentId || undefined,
    };
    roomRepo.updateAsset(updatedAsset);
    onClose();
  };

  const handleDelete = () => {
    roomRepo.deleteAsset(asset.assetId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#1A237E] text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 size={18} className="text-amber-300" />
            <h3 className="font-extrabold text-sm sm:text-base">
              Modifier le Fichier / Exercice
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Nom du Document / Exercice</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Classe / Niveau</label>
              <select
                value={level}
                onChange={(e) => {
                  const newLevel = e.target.value as SecondaryLevel;
                  setLevel(newLevel);
                  const validSubs = getSubjectsForLevel(newLevel);
                  if (!validSubs.includes(subject)) {
                    setSubject(validSubs[0]);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-[#1A237E]"
              >
                {ALL_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Matière</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-[#1A237E]"
              >
                {getSubjectsForLevel(level).map((sb) => (
                  <option key={sb} value={sb}>{sb}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Type de Média</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "pdf" | "video" | "image")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
              >
                <option value="pdf">Fichier PDF</option>
                <option value="video">Capsule Vidéo</option>
                <option value="image">Fiche Schéma / Image</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Taille estimée</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Chemin de stockage / URL</label>
            <input
              type="text"
              required
              value={storagePath}
              onChange={(e) => setStoragePath(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Rattacher à une Leçon / Cours (Optionnel)</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
            >
              <option value="">-- Exercice Indépendant --</option>
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.level} - {c.subject}] {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-colors border border-rose-200 cursor-pointer"
            >
              <Trash2 size={15} />
              <span>Supprimer le Fichier</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1A237E] hover:bg-indigo-900 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow transition-colors cursor-pointer"
              >
                <Save size={15} />
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
