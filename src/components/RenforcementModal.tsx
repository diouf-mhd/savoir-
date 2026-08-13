import React, { useState, useEffect } from "react";
import { SecondaryLevel, Subject, PaymentTransaction } from "../types";
import { ALL_LEVELS, getSubjectsForLevel } from "../data/mockData";
import { RoomDatabaseRepository } from "../data/roomStorage";
import { saveTransactionToFirebase } from "../data/firebaseStorage";
import { Users, X, Check, CreditCard, Calendar, BookOpen, AlertCircle, CheckCircle2, User, Clock, FileText } from "lucide-react";

interface RenforcementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLevel: SecondaryLevel;
  userName: string;
  userUid?: string;
  onOpenReceipt?: (tx: PaymentTransaction) => void;
}

const MONTHS = [
  "Octobre",
  "Novembre",
  "Décembre",
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
];

export const RenforcementModal: React.FC<RenforcementModalProps> = ({
  isOpen,
  onClose,
  userLevel,
  userName,
  userUid,
  onOpenReceipt,
}) => {
  const [level, setLevel] = useState<SecondaryLevel>(userLevel);
  const [learnerName, setLearnerName] = useState<string>(userName || "");
  const [paymentType, setPaymentType] = useState<"inscription" | "mensualite">("inscription");
  const [selectedMonth, setSelectedMonth] = useState<string>("Octobre");
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"wave" | "orange" | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdTx, setCreatedTx] = useState<PaymentTransaction | null>(null);

  // Update selected level when modal opens or userLevel changes
  useEffect(() => {
    setLevel(userLevel);
    if (!learnerName) {
      setLearnerName(userName || "");
    }
    setSelectedSubjects(getSubjectsForLevel(userLevel).slice(0, 2));
  }, [userLevel, userName, isOpen]);

  if (!isOpen) return null;

  const availableSubjects = getSubjectsForLevel(level);

  // Calculate price dynamically
  const calculateAmount = (): number => {
    if (paymentType === "inscription") {
      if (level.startsWith("Terminale") || level === "Terminale") return 6000;
      return 5000;
    } else {
      if (level === "6ème" || level === "5ème") return 4000;
      return 5000;
    }
  };

  const amount = calculateAmount();

  const handleSubjectToggle = (subj: Subject) => {
    if (selectedSubjects.includes(subj)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subj));
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  const handleLevelChange = (newLvl: SecondaryLevel) => {
    setLevel(newLvl);
    const valid = getSubjectsForLevel(newLvl);
    setSelectedSubjects(selectedSubjects.filter((s) => valid.includes(s)));
  };

  const handlePay = (method: "wave" | "orange") => {
    setErrorMsg("");
    if (!learnerName.trim()) {
      setErrorMsg("Veuillez saisir le Prénom et Nom de l'apprenant.");
      return;
    }
    if (selectedSubjects.length === 0) {
      setErrorMsg("Veuillez sélectionner au moins une matière à renforcer.");
      return;
    }

    const roomRepo = RoomDatabaseRepository.getInstance();

    // Règle d'unicité : Le même nom ne pourra pas faire deux mensualités sur le même mois
    if (paymentType === "mensualite") {
      const isDuplicate = roomRepo.checkDuplicateMensualite(learnerName, selectedMonth);
      if (isDuplicate) {
        setErrorMsg(
          `Attention : L'apprenant "${learnerName.trim()}" a déjà un paiement enregistré pour la mensualité du mois de ${selectedMonth}. Le même nom ne peut pas faire deux mensualités sur le même mois.`
        );
        return;
      }
    }

    const newTx: PaymentTransaction = {
      id: "tx_" + Date.now(),
      userUid: userUid || "user_massaw_01",
      userName: userName || "Élève / Parent",
      learnerName: learnerName.trim(),
      type: "renforcement",
      paymentType: paymentType,
      selectedMonth: paymentType === "mensualite" ? selectedMonth : undefined,
      level: level,
      subjects: selectedSubjects,
      amount: amount,
      operator: method,
      phoneNumber: "78 376 95 84",
      status: "pending",
      createdAt: Date.now(),
      dateFormatted: `Aujourd'hui, ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
    };

    roomRepo.insertTransaction(newTx);
    saveTransactionToFirebase(newTx).catch(console.error);
    setCreatedTx(newTx);
    setPaymentMethod(method);
    setIsSuccess(true);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setPaymentMethod(null);
    setCreatedTx(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-[#1A237E] flex items-center justify-center font-bold shadow-xs">
              <Users size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Renforcements (Au Centre)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Encadrement pédagogique au centre de l'encadreur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center py-4 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full mx-auto flex items-center justify-center shadow-inner relative">
              <Clock size={36} className="animate-spin" />
            </div>
            
            <div className="space-y-1">
              <span className="px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-full border border-amber-300 inline-block">
                Statut : En attente de validation
              </span>
              <h4 className="text-base font-black text-slate-900 pt-1">
                Demande transmise à l'Administration
              </h4>
              <p className="text-xs font-extrabold text-amber-800 bg-amber-50 p-3 rounded-2xl border border-amber-200 max-w-md mx-auto">
                "Paiement en cours de vérification par l'administration"
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Apprenant (Bénéficiaire) :</span>
                <span className="font-bold text-[#1A237E]">{learnerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Service :</span>
                <span className="font-bold text-slate-800">Renforcements au Centre</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Type de paiement :</span>
                <span className="font-bold text-indigo-900">
                  {paymentType === "inscription" ? "Frais d'inscription" : `Mensualité (${selectedMonth})`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Numéro de transfert destinataire :</span>
                <span className="font-black text-amber-700">78 376 95 84</span>
              </div>
              <div className="flex justify-between py-1 pt-2 font-black text-sm text-[#1A237E]">
                <span>Montant envoyé :</span>
                <span>{amount.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>

            <div className="space-y-2">
              {createdTx && onOpenReceipt && (
                <button
                  type="button"
                  onClick={() => {
                    if (createdTx) onOpenReceipt(createdTx);
                  }}
                  className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-[#1A237E] font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 border border-indigo-200 cursor-pointer"
                >
                  <FileText size={16} />
                  <span>Voir / Imprimer le Reçu Numérique</span>
                </button>
              )}

              <button
                onClick={handleReset}
                className="w-full py-3 bg-[#1A237E] hover:bg-indigo-900 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold flex items-start space-x-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Prénom et Nom de l'apprenant (Élève) */}
            <div className="bg-indigo-50/60 border border-indigo-100 p-3 rounded-2xl space-y-1">
              <label className="font-extrabold text-indigo-950 block text-xs flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <User size={14} className="text-[#1A237E]" />
                  <span>Prénom et Nom de l'apprenant * :</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (Permet de payer pour un autre élève)
                </span>
              </label>
              <input
                type="text"
                value={learnerName}
                onChange={(e) => setLearnerName(e.target.value)}
                placeholder="Ex: Awa Ndiaye"
                className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 font-bold text-[#1A237E] focus:outline-hidden focus:ring-2 focus:ring-[#1A237E]"
              />
            </div>

            {/* Niveau d'étude */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Niveau d'étude de l'élève :
              </label>
              <select
                value={level}
                onChange={(e) => handleLevelChange(e.target.value as SecondaryLevel)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-[#1A237E]"
              >
                {ALL_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Classe de {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* Type de paiement */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Type de paiement :
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType("inscription")}
                  className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer ${
                    paymentType === "inscription"
                      ? "bg-indigo-50 border-[#1A237E] text-[#1A237E] shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CreditCard size={18} className="mb-1" />
                  <span>Frais d'inscription</span>
                  <span className="text-[10px] opacity-80 mt-0.5">
                    {level === "Terminale" ? "6 000 FCFA" : "5 000 FCFA"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType("mensualite")}
                  className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer ${
                    paymentType === "mensualite"
                      ? "bg-indigo-50 border-[#1A237E] text-[#1A237E] shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Calendar size={18} className="mb-1" />
                  <span>Mensualité</span>
                  <span className="text-[10px] opacity-80 mt-0.5">
                    {level === "6ème" || level === "5ème" ? "4 000 FCFA / mois" : "5 000 FCFA / mois"}
                  </span>
                </button>
              </div>
            </div>

            {/* Choix du mois si Mensualité */}
            {paymentType === "mensualite" && (
              <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl space-y-1.5 animate-in fade-in">
                <label className="font-extrabold text-amber-950 block text-xs flex items-center space-x-1">
                  <Calendar size={14} className="text-amber-700" />
                  <span>Choix obligatoire du mois concerné :</span>
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-xl p-2 font-bold text-amber-950"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      Mois de {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Matières à renforcer */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center space-x-1">
                <BookOpen size={14} />
                <span>Matières à renforcer (cases à cocher) :</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                {availableSubjects.map((subj) => {
                  const checked = selectedSubjects.includes(subj);
                  return (
                    <label
                      key={subj}
                      onClick={() => handleSubjectToggle(subj)}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center space-x-2 cursor-pointer transition-all ${
                        checked
                          ? "bg-indigo-900 text-white border-indigo-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          checked ? "bg-amber-400 border-amber-400 text-indigo-950" : "border-slate-300 bg-white"
                        }`}
                      >
                        {checked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="truncate">{subj}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Destination Transfer Alert */}
            <div className="bg-amber-100/70 border border-amber-300 p-2.5 rounded-xl text-amber-950 text-[11px] font-bold text-center">
              ⚠️ Effectuez votre transfert Wave / OM vers le numéro :{" "}
              <span className="text-[#1A237E] font-black text-xs underline">78 376 95 84</span>
            </div>

            {/* Dynamic Total calculation display */}
            <div className="bg-gradient-to-r from-[#1A237E] to-indigo-900 text-white p-4 rounded-2xl shadow-md space-y-1">
              <div className="flex justify-between items-center text-xs opacity-90">
                <span>Paiement calculé ({level}) :</span>
                <span className="font-semibold">
                  {paymentType === "inscription" ? "Frais d'inscription" : `Mensualité (${selectedMonth})`}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg font-black text-amber-300 pt-1 border-t border-indigo-800">
                <span>Montant Total :</span>
                <span>{amount.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>

            {/* Payment buttons Mobile Money */}
            <div className="space-y-2 pt-1">
              <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider text-center">
                Procéder au Paiement (Transfert vers 78 376 95 84) :
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePay("wave")}
                  className="py-3 px-3 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span>Payer par Wave</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePay("orange")}
                  className="py-3 px-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span>Orange Money</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

