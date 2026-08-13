import React, { useState } from "react";
import { Quiz, QuizQuestion, SecondaryLevel, QuizResultRecord } from "../types";
import { getSubjectsForLevel } from "../data/mockData";
import { RoomDatabaseRepository } from "../data/roomStorage";
import { EditQuizModal } from "./EditQuizModal";
import { 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Award, 
  RotateCcw, 
  Sparkles, 
  ArrowRight,
  Clock,
  BookOpen,
  Edit3,
  Trash2
} from "lucide-react";

interface QuizTabProps {
  userLevel: SecondaryLevel;
  quizzes: Quiz[];
  isAdmin?: boolean;
}

export const QuizTab: React.FC<QuizTabProps> = ({ userLevel, quizzes, isAdmin }) => {
  const roomRepo = RoomDatabaseRepository.getInstance();

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  const handleDeleteQuiz = (quiz: Quiz) => {
    roomRepo.deleteQuiz(quiz.id);
    if (activeQuiz?.id === quiz.id) {
      resetActiveQuiz();
    }
  };

  // Filter quizzes by current user level and allowed subjects
  const availableSubjects = getSubjectsForLevel(userLevel);
  const levelQuizzes = quizzes.filter((q) => q.level === userLevel && availableSubjects.includes(q.subject));

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const calculateScore = () => {
    if (!activeQuiz) return 0;
    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });
    return Math.round((correctCount / activeQuiz.questions.length) * 100);
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    setIsSubmitted(true);

    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / activeQuiz.questions.length) * 100);
    const score20 = Math.round((correctCount / activeQuiz.questions.length) * 20 * 10) / 10;

    const user = roomRepo.getUserProfile();
    const studentId = user?.uid || "user_guest";
    const studentName = user?.displayName || "Élève";

    const resultRecord: QuizResultRecord = {
      id: "res_" + Date.now(),
      studentId,
      studentName,
      quizTitle: activeQuiz.title,
      subject: activeQuiz.subject,
      level: activeQuiz.level,
      scorePercentage: scorePct,
      score20,
      totalQuestions: activeQuiz.questions.length,
      correctAnswers: correctCount,
      date: new Date().toLocaleDateString("fr-FR"),
      timestamp: Date.now(),
    };

    roomRepo.addQuizResult(studentId, resultRecord);
  };

  const resetActiveQuiz = () => {
    setActiveQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Quiz List Mode */}
      {!activeQuiz ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase mb-1">
              <Sparkles size={14} />
              <span>QCM Interactifs • Classe de {userLevel}</span>
            </div>
            <h2 className="text-xl font-black">Évaluations & Tests de Connaissances</h2>
            <p className="text-indigo-200 text-xs mt-1">
              Révisez avec des séries QCM avec correction détaillée et score en pourcentage.
            </p>
          </div>

          {levelQuizzes.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <HelpCircle size={36} className="mx-auto text-slate-300 mb-2" />
              <h3 className="font-bold text-slate-700 text-sm">Aucun quiz disponible</h3>
              <p className="text-xs text-slate-500 mt-1">
                Aucun QCM enregistré dans Room pour la classe de {userLevel}. Accédez à l'Espace Admin dans Profil pour en créer !
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {levelQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-indigo-300 transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-[#1A237E] font-bold text-xs rounded-md">
                        {quiz.subject}
                      </span>
                      <span className="text-xs text-slate-500">{quiz.questions.length} question(s)</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{quiz.title}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isAdmin && (
                      <div className="flex items-center space-x-1.5 bg-amber-50 p-1 rounded-xl border border-amber-200">
                        <button
                          type="button"
                          onClick={() => setEditingQuiz(quiz)}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-lg flex items-center space-x-1 transition-colors shadow-xs cursor-pointer"
                          title="Modifier ce Quiz QCM"
                        >
                          <Edit3 size={14} />
                          <span className="hidden sm:inline">Modifier</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuiz(quiz)}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg flex items-center space-x-1 transition-colors shadow-xs cursor-pointer"
                          title="Supprimer ce Quiz"
                        >
                          <Trash2 size={14} />
                          <span className="hidden sm:inline">Supprimer</span>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => startQuiz(quiz)}
                      className="px-4 py-2 bg-[#1A237E] hover:bg-indigo-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Démarrer</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Active Quiz Interface */
        <div className="space-y-4">
          {/* Active Quiz Header */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                {activeQuiz.subject} • {userLevel}
              </span>
              <h3 className="font-bold text-slate-900 text-base">{activeQuiz.title}</h3>
            </div>
            <button
              onClick={resetActiveQuiz}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 bg-slate-100 rounded-lg"
            >
              Quitter
            </button>
          </div>

          {!isSubmitted ? (
            /* Question Card */
            <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Question {currentQuestionIndex + 1} sur {activeQuiz.questions.length}</span>
                <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#1A237E] h-1.5 transition-all duration-300"
                    style={{
                      width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {(() => {
                const question = activeQuiz.questions[currentQuestionIndex];
                const selectedOpt = selectedAnswers[currentQuestionIndex];

                return (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {question.question}
                    </h4>

                    <div className="space-y-2.5">
                      {question.options.map((option, optIdx) => {
                        const isSelected = selectedOpt === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                            className={`w-full p-3.5 rounded-xl text-xs sm:text-sm font-medium text-left transition-all flex items-center justify-between border ${
                              isSelected
                                ? "bg-indigo-50 border-[#1A237E] text-[#1A237E] font-semibold ring-1 ring-[#1A237E]"
                                : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span>{option}</span>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                                isSelected
                                  ? "border-[#1A237E] bg-[#1A237E] text-white"
                                  : "border-slate-300 text-slate-400"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40"
                >
                  ← Précédente
                </button>

                {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="px-4 py-2 bg-[#1A237E] text-white rounded-xl text-xs font-bold shadow"
                  >
                    Suivante →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                  >
                    Valider le Quiz & Voir le Score
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Results & Explanations Screen */
            <div className="space-y-5">
              {/* Score Banner */}
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-md space-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center shadow-inner">
                  <Award size={32} />
                </div>

                <div>
                  <h4 className="text-2xl font-black text-slate-900">
                    Résultat : {calculateScore()}%
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {calculateScore() >= 80
                      ? "Félicitations ! Excellente maîtrise de cette leçon."
                      : calculateScore() >= 50
                      ? "Bon travail ! Relisez la correction expliquée ci-dessous pour vous perfectionner."
                      : "Continuez de réviser le cours associé pour progresser."}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={resetActiveQuiz}
                    className="px-4 py-2 bg-[#1A237E] text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1"
                  >
                    <RotateCcw size={14} />
                    <span>Retour à la liste des Quiz</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Corrections */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Correction Expliquée Étape par Étape :
                </h4>

                {activeQuiz.questions.map((q, idx) => {
                  const userChoice = selectedAnswers[idx];
                  const isCorrect = userChoice === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border bg-white space-y-2.5 ${
                        isCorrect ? "border-emerald-200" : "border-rose-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <h5 className="font-bold text-slate-900 text-xs sm:text-sm pr-2">
                          {idx + 1}. {q.question}
                        </h5>
                        {isCorrect ? (
                          <span className="flex items-center space-x-1 text-emerald-600 font-bold text-xs flex-shrink-0">
                            <CheckCircle2 size={16} />
                            <span>Correct (+1)</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-rose-600 font-bold text-xs flex-shrink-0">
                            <XCircle size={16} />
                            <span>Inexact</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl">
                        <p className="text-slate-700">
                          <strong className="text-slate-900">Votre réponse : </strong>
                          {userChoice !== undefined ? q.options[userChoice] : "Aucune réponse"}
                        </p>
                        <p className="text-emerald-700 font-semibold">
                          <strong className="text-emerald-800">Réponse exacte : </strong>
                          {q.options[q.correctIndex]}
                        </p>
                      </div>

                      <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-950 space-y-1">
                        <strong className="text-amber-900 flex items-center space-x-1">
                          <Sparkles size={12} />
                          <span>Explication pédagogique :</span>
                        </strong>
                        <p className="italic leading-relaxed">{q.explanation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Quiz Modal */}
      <EditQuizModal
        quiz={editingQuiz}
        isOpen={Boolean(editingQuiz)}
        onClose={() => setEditingQuiz(null)}
      />
    </div>
  );
};
