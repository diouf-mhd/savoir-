import React, { useState, useEffect } from "react";
import { SecondaryLevel, Subject, PaymentTransaction } from "../types";
import { ALL_LEVELS, getSubjectsForLevel } from "../data/mockData";
import { RoomDatabaseRepository } from "../data/roomStorage";
import { saveTransactionToFirebase } from "../data/firebaseStorage";
import { Home, X, Check, MapPin, User, Clock, BookOpen, AlertCircle, CheckCircle2, FileText, Calendar } from "lucide-react";

interface DomicileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLevel: SecondaryLevel;
  userName: string;
  userUid?: string;
  onOpenReceipt?: (tx: PaymentTransaction) => void;
}

type SerieType = "Enseignement Général" | "Série L" | "Série S";
type HoursType = "2h/semaine" | "4h/semaine" | "6h/semaine";

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

export const DomicileModal: React.FC<DomicileModalProps> = ({
  isOpen,
  onClose,
  userLevel,
  userName,
  userUid,
  onOpenReceipt,
}) => {
  const [tuteurName, setTuteurName] = useState("");
  const [learnerName, setLearnerName] = useState(userName || "");
  const [address, setAddress] = useState("");
  const [level, setLevel] = useState<SecondaryLevel>(userLevel);
  const [serie, setSerie] = useState<SerieType>("Enseignement Général");
  const [selectedMonth, setSelectedMonth] = useState<string>("Octobre");
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<HoursType>("2h/semaine");
  const [paymentMethod, setPaymentMethod] = useState<"wave" | "orange" | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdTx, setCreatedTx] = useState<PaymentTransaction | null>(null);

  const checkIsLycee = (lvl: SecondaryLevel) => {
    return (
      lvl.startsWith("Seconde") ||
      lvl.startsWith("Première") ||
      lvl.startsWith("Terminale") ||
      lvl === "2nde" ||
      lvl === "1ère" ||
      lvl === "Terminale"
    );
  };

  // Sync level with user level on open
  useEffect(() => {
    setLevel(userLevel);
    if (!learnerName) {
      setLearnerName(userName || "");
    }
    setSelectedSubjects(getSubjectsForLevel(userLevel).slice(0, 2));

    if (checkIsLycee(userLevel)) {
      if (
        userLevel === "Seconde L" ||
        userLevel.startsWith("Première L") ||
        userLevel.startsWith("Terminale L")
      ) {
        setSerie("Série L");
      } else {
        setSerie("Série S");
      }
    } else {
      setSerie("Enseignement Général");
    }
  }, [userLevel, userName, isOpen]);

  if (!isOpen) return null;

  const isLycee = checkIsLycee(level);
  const availableSubjects = getSubjectsForLevel(level);

  const handleLevelChange = (newLvl: SecondaryLevel) => {
    setLevel(newLvl);
    const valid = getSubjectsForLevel(newLvl);
    setSelectedSubjects(selectedSubjects.filter((s) => valid.includes(s)));

    if (checkIsLycee(newLvl)) {
      if (
        newLvl === "Seconde L" ||
        newLvl.startsWith("Première L") ||
        newLvl.startsWith("Terminale L")
      ) {
        setSerie("Série L");
      } else if (
        newLvl === "Seconde S" ||
        newLvl.startsWith("Première S") ||
        newLvl.startsWith("Terminale S")
      ) {
        setSerie("Série S");
      } else {
        if (serie === "Enseignement Général") {
          setSerie("Série S");
        }
      }
    } else {
      setSerie("Enseignement Général");
    }
  };

  const handleSubjectToggle = (subj: Subject) => {
    if (selectedSubjects.includes(subj)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subj));
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  // CALCUL DYNAMIQUE ET TARIF SUR-MESURE À DOMICILE :
  // Tarif de base (6ème à 3ème) :
  // 2h / semaine = 10 000 FCFA
  // 4h / semaine = 20 000 FCFA
  // 6h / semaine = 30 000 FCFA
  // Majoration par pourcentage pour le Lycée (2nde à Terminale) :
  // Pour la Série L (Seconde L, Première L1/L2/L', Terminale L1/L2/L') : Applique +30% au tarif de base (ex: 2h/semaine = 13 000 FCFA)
  // Pour la Série S (Seconde S, Première S1/S2, Terminale S1/S2) : Applique +50% au tarif de base (ex: 2h/semaine = 15 000 FCFA)
  const calculateAmount = (): { base: number; markupPercent: number; total: number } => {
    let base = 10000;
    if (weeklyHours === "4h/semaine") base = 20000;
    if (weeklyHours === "6h/semaine") base = 30000;

    let markupPercent = 0;
    if (isLycee) {
      if (
        serie === "Série L" ||
        level === "Seconde L" ||
        level.startsWith("Première L") ||
        level.startsWith("Terminale L")
      ) {
        markupPercent = 30;
      } else if (
        serie === "Série S" ||
        level === "Seconde S" ||
        level.startsWith("Première S") ||
        level.startsWith("Terminale S")
      ) {
        markupPercent = 50;
      } else {
        markupPercent = 30;
      }
    }

    const total = Math.round(base * (1 + markupPercent / 100));
    return { base, markupPercent, total };
  };

  const { base, markupPercent, total } = calculateAmount();

  const handlePay = (method: "wave" | "orange") => {
    setErrorMsg("");
    if (!learnerName.trim()) {
      setErrorMsg("Veuillez saisir le Prénom et Nom de l'apprenant.");
      return;
    }
    if (!tuteurName.trim()) {
      setErrorMsg("Veuillez saisir le Nom et Prénom du tuteur (Parent / Responsable).");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("Veuillez saisir l'adresse exacte du domicile.");
      return;
    }
    if (selectedSubjects.length === 0) {
      setErrorMsg("Veuillez sélectionner au moins une matière à renforcer.");
      return;
    }

    const roomRepo = RoomDatabaseRepository.getInstance();

    // Règle d'unicité
    const isDuplicate = roomRepo.checkDuplicateMensualite(learnerName, selectedMonth);
    if (isDuplicate) {
      setErrorMsg(
        `Attention : L'apprenant "${learnerName.trim()}" a déjà un paiement enregistré pour la mensualité du mois de ${selectedMonth}. Le même nom ne peut pas faire deux mensualités sur le même mois.`
      );
      return;
    }

    const newTx: PaymentTransaction = {
      id: "tx_" + Date.now(),
      userUid: userUid || "user_massaw_01",
      userName: userName || "Élève / Parent",
      learnerName: learnerName.trim(),
      type: "domicile",
      paymentType: "mensualite",
      selectedMonth: selectedMonth,
      level: level,
      subjects: selectedSubjects,
      amount: total,
      operator: method,
      phoneNumber: "78 376 95 84",
      status: "pending",
      createdAt: Date.now(),
      dateFormatted: `Aujourd'hui, ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      tuteurName: tuteurName.trim(),
      address: address.trim(),
      weeklyHours: weeklyHours,
      serie: isLycee ? serie : undefined,
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
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-xs">
              <Home size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Cours à Domicile (Chez l'Élève)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Suivi individuel personnalisé à votre domicile
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
                <span className="text-slate-500">Tuteur Responsable :</span>
                <span className="font-bold text-slate-800">{tuteurName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Adresse de livraison :</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">{address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Niveau & Mensualité :</span>
                <span className="font-bold text-indigo-900">{level} ({serie}) - Mois de {selectedMonth}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Numéro de transfert destinataire :</span>
                <span className="font-black text-amber-700">78 376 95 84</span>
              </div>
              <div className="flex justify-between py-1 pt-2 font-black text-sm text-[#1A237E]">
                <span>Total mensuel calculé :</span>
                <span>{total.toLocaleString("fr-FR")} FCFA / mois</span>
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
          <div className="space-y-3.5 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold flex items-start space-x-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Prénom et Nom de l'apprenant (Élève) */}
            <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-2xl space-y-1">
              <label className="font-extrabold text-amber-950 block text-xs flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <User size={14} className="text-amber-800" />
                  <span>Prénom et Nom de l'apprenant * :</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (Nom de l'élève)
                </span>
              </label>
              <input
                type="text"
                required
                value={learnerName}
                onChange={(e) => setLearnerName(e.target.value)}
                placeholder="Ex: Awa Ndiaye"
                className="w-full bg-white border border-amber-300 rounded-xl p-2.5 font-bold text-[#1A237E] focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Nom et Prénom du tuteur */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center space-x-1">
                <User size={14} className="text-indigo-800" />
                <span>Nom et Prénom du tuteur (Parent / Responsable) * :</span>
              </label>
              <input
                type="text"
                required
                value={tuteurName}
                onChange={(e) => setTuteurName(e.target.value)}
                placeholder="Ex: M. Ousmane Diop"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-hidden focus:border-[#1A237E]"
              />
            </div>

            {/* Adresse exacte du domicile */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center space-x-1">
                <MapPin size={14} className="text-red-600" />
                <span>Adresse exacte du domicile * :</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Dakar, Sacré Cœur 3, Villa N° 12"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-hidden focus:border-[#1A237E]"
              />
            </div>

            {/* Mois de la mensualité */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center space-x-1">
                <Calendar size={14} className="text-amber-700" />
                <span>Mois de la mensualité :</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-amber-950"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    Mois de {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Niveau & Série */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Niveau de l'apprenant :
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

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Série / Orientation :
                </label>
                {isLycee ? (
                  <select
                    value={serie}
                    onChange={(e) => setSerie(e.target.value as SerieType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-900"
                  >
                    <option value="Série L">Série L (Littéraire, +30%)</option>
                    <option value="Série S">Série S (Scientifique, +50%)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value="Enseignement Général"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-500"
                  />
                )}
              </div>
            </div>

            {/* Matières à renforcer */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center space-x-1">
                <BookOpen size={14} />
                <span>Matières à renforcer à domicile :</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1">
                {availableSubjects.map((subj) => {
                  const checked = selectedSubjects.includes(subj);
                  return (
                    <label
                      key={subj}
                      onClick={() => handleSubjectToggle(subj)}
                      className={`p-2 rounded-xl border font-bold text-xs flex items-center space-x-2 cursor-pointer transition-all ${
                        checked
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          checked ? "bg-white border-white text-amber-700" : "border-slate-300 bg-white"
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

            {/* Horaires hebdomadaires */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center space-x-1">
                <Clock size={14} className="text-indigo-800" />
                <span>Sélection des Horaires hebdomadaires :</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["2h/semaine", "4h/semaine", "6h/semaine"] as HoursType[]).map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setWeeklyHours(hrs)}
                    className={`py-2 px-1 rounded-xl border font-extrabold text-xs text-center transition-all cursor-pointer ${
                      weeklyHours === hrs
                        ? "bg-[#1A237E] text-amber-300 border-[#1A237E] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {hrs}
                  </button>
                ))}
              </div>
            </div>

            {/* DYNAMIC PRICE SUMMARY */}
            <div className="bg-gradient-to-r from-amber-900 to-amber-950 text-white p-4 rounded-2xl shadow-md space-y-1">
              <div className="flex justify-between items-center text-[11px] text-amber-200">
                <span>Tarif de base ({weeklyHours}) :</span>
                <span className="font-semibold">{base.toLocaleString("fr-FR")} FCFA</span>
              </div>
              {isLycee && (
                <div className="flex justify-between items-center text-[11px] text-amber-300">
                  <span>Majoration Lycée ({serie}) :</span>
                  <span className="font-bold">+{markupPercent}%</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-black text-amber-300 pt-1.5 border-t border-amber-800/80">
                <span>Tarif Sur-Mesure Calculé :</span>
                <span>{total.toLocaleString("fr-FR")} FCFA / mois</span>
              </div>
            </div>

            {/* Mobile Money Payment buttons */}
            <div className="space-y-2 pt-1">
              <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider text-center">
                Valider et Payer par Mobile Money :
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
