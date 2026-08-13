import React, { useState, useEffect } from "react";
import { Course, SecondaryLevel, Subject } from "../types";
import { ALL_LEVELS, getSubjectsForLevel } from "../data/mockData";
import { RoomDatabaseRepository } from "../data/roomStorage";
import { BookOpen, X, Edit3, Save, Trash2, Sparkles } from "lucide-react";

interface EditCourseModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditCourseModal: React.FC<EditCourseModalProps> = ({
  course,
  isOpen,
  onClose,
}) => {
  const roomRepo = RoomDatabaseRepository.getInstance();

  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<SecondaryLevel>("3ème");
  const [subject, setSubject] = useState<Subject>("Maths");
  const [chapter, setChapter] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setLevel(course.level);
      setSubject(course.subject);
      setChapter(course.chapter);
      setSummary(course.summary);
      setContent(course.content);
    }
  }, [course]);

  if (!isOpen || !course) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCourse: Course = {
      ...course,
      title,
      level,
      subject,
      chapter,
      summary,
      content,
      createdAt: Date.now(),
    };
    roomRepo.updateCourse(updatedCourse);
    onClose();
  };

  const handleDelete = () => {
    roomRepo.deleteCourse(course.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#1A237E] text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 size={18} className="text-amber-300" />
            <h3 className="font-extrabold text-sm sm:text-base">
              Modifier le Cours Rédigé
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

          <div>
            <label className="font-bold text-slate-700 block mb-1">Titre de la leçon rédigée</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Chapitre</label>
            <input
              type="text"
              required
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Résumé synthétique</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Contenu détaillé rédigé</label>
            <textarea
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono text-xs leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-colors border border-rose-200 cursor-pointer"
            >
              <Trash2 size={15} />
              <span>Supprimer le Cours</span>
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
                <span>Enregistrer la modification</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
