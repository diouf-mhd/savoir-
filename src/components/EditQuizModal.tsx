import React, { useState, useEffect } from "react";
import { Quiz, QuizQuestion, SecondaryLevel, Subject } from "../types";
import { ALL_LEVELS, getSubjectsForLevel } from "../data/mockData";
import { RoomDatabaseRepository } from "../data/roomStorage";
import { HelpCircle, X, Edit3, Save, Trash2, Plus } from "lucide-react";

interface EditQuizModalProps {
  quiz: Quiz | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditQuizModal: React.FC<EditQuizModalProps> = ({
  quiz,
  isOpen,
  onClose,
}) => {
  const roomRepo = RoomDatabaseRepository.getInstance();

  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<SecondaryLevel>("3ème");
  const [subject, setSubject] = useState<Subject>("Maths");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title);
      setLevel(quiz.level);
      setSubject(quiz.subject);
      setQuestions(JSON.parse(JSON.stringify(quiz.questions)));
    }
  }, [quiz]);

  if (!isOpen || !quiz) return null;

  const handleUpdateQuestionText = (qIdx: number, text: string) => {
    const copy = [...questions];
    copy[qIdx].question = text;
    setQuestions(copy);
  };

  const handleUpdateExplanation = (qIdx: number, exp: string) => {
    const copy = [...questions];
    copy[qIdx].explanation = exp;
    setQuestions(copy);
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const copy = [...questions];
    copy[qIdx].options[optIdx] = val;
    setQuestions(copy);
  };

  const handleSetCorrectIndex = (qIdx: number, correctIdx: number) => {
    const copy = [...questions];
    copy[qIdx].correctIndex = correctIdx;
    setQuestions(copy);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: "q_" + Date.now(),
        question: "Nouvelle question QCM...",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctIndex: 0,
        explanation: "Explication de la réponse...",
      },
    ]);
  };

  const handleRemoveQuestion = (qIdx: number) => {
    if (questions.length <= 1) {
      alert("Un Quiz QCM doit contenir au moins 1 question.");
      return;
    }
    setQuestions(questions.filter((_, idx) => idx !== qIdx));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || questions.length === 0) return;

    const updatedQuiz: Quiz = {
      ...quiz,
      title,
      level,
      subject,
      questions,
    };

    roomRepo.updateQuiz(updatedQuiz);
    onClose();
  };

  const handleDelete = () => {
    roomRepo.deleteQuiz(quiz.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#1A237E] text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 size={18} className="text-amber-300" />
            <h3 className="font-extrabold text-sm sm:text-base">
              Modifier le Quiz QCM & ses Questions
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
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Titre du Quiz QCM</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

          {/* Questions Section */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                Édition des Questions ({questions.length}) :
              </h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#1A237E] font-bold rounded-xl text-xs flex items-center space-x-1 border border-indigo-200 cursor-pointer"
              >
                <Plus size={14} />
                <span>Ajouter une Question</span>
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div
                key={q.id || qIdx}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#1A237E] text-xs">
                    Question #{qIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="text-slate-400 hover:text-rose-600 transition-colors text-xs font-bold"
                  >
                    Supprimer question
                  </button>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Intitulé de la question :</label>
                  <input
                    type="text"
                    required
                    value={q.question}
                    onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 font-semibold"
                  />
                </div>

                {/* Options List */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    Propositions (Cochez la réponse exacte) :
                  </label>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`correct_${qIdx}`}
                        checked={q.correctIndex === optIdx}
                        onChange={() => handleSetCorrectIndex(qIdx, optIdx)}
                        className="w-4 h-4 text-[#1A237E] cursor-pointer"
                      />
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                        className={`flex-1 bg-white border rounded-xl p-2 text-xs ${
                          q.correctIndex === optIdx
                            ? "border-emerald-500 font-bold bg-emerald-50/50"
                            : "border-slate-200"
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">Explication pédagogique :</label>
                  <input
                    type="text"
                    value={q.explanation || ""}
                    onChange={(e) => handleUpdateExplanation(qIdx, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-700 text-xs"
                    placeholder="Pourquoi cette réponse est-elle correcte ?"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-colors border border-rose-200 cursor-pointer"
            >
              <Trash2 size={15} />
              <span>Supprimer le Quiz QCM</span>
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
                <span>Enregistrer le QCM</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
