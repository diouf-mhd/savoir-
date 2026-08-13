import React, { useState, useRef, useEffect } from "react";
import { UserProfile, SecondaryLevel, PaymentTransaction, ClassChangeRequest } from "../types";
import { ALL_LEVELS } from "../data/mockData";
import { RoomDatabaseRepository } from "../data/roomStorage";
import { updateUserPasswordFirebase, signOutFirebase } from "../data/firebaseStorage";
import { AdminContactCard } from "./AdminContactCard";
import { appLogo } from "../utils/assetImages";
import { checkForAppUpdates, CURRENT_APP_VERSION } from "../utils/versionUtils";
import { 
  User, 
  GraduationCap, 
  Trash2, 
  LogOut, 
  ShieldCheck, 
  Key, 
  Camera, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  Code2,
  Edit2,
  Check,
  X,
  Upload,
  CreditCard,
  Clock,
  FileText,
  XCircle,
  CheckCircle2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Send,
  Hourglass,
  Sparkles
} from "lucide-react";

interface ProfileTabProps {
  user: UserProfile;
  onUpdateLevel: (newLevel: SecondaryLevel) => void;
  onUpdatePhoto: (newUrl: string) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onClearRoomCache: () => void;
  onResetDatabase: () => void;
  onOpenAdmin: () => void;
  onOpenCodeViewer: () => void;
  onLogout: () => void;
  onOpenReceipt?: (tx: PaymentTransaction) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  onUpdateLevel,
  onUpdatePhoto,
  onUpdateProfile,
  onClearRoomCache,
  onResetDatabase,
  onOpenAdmin,
  onOpenCodeViewer,
  onLogout,
  onOpenReceipt,
}) => {
  const roomRepo = RoomDatabaseRepository.getInstance();
  const [selectedLevel, setSelectedLevel] = useState<SecondaryLevel>(user.level);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(user.displayName);
  const [showLevelConfirm, setShowLevelConfirm] = useState(false);
  const [targetLevel, setTargetLevel] = useState<SecondaryLevel | null>(null);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Class Change Request & Manual Update Check State
  const [classChangeReason, setClassChangeReason] = useState("");
  const [classChangeReasonError, setClassChangeReasonError] = useState("");
  const [pendingRequest, setPendingRequest] = useState<ClassChangeRequest | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleManualUpdateCheck = async () => {
    setIsCheckingUpdate(true);
    try {
      const res = await checkForAppUpdates();
      if (res.hasUpdate) {
        window.location.reload(); // Reload to trigger App useEffect pop-up
      } else {
        setToastMsg(`Vous utilisez déjà la dernière version (v${CURRENT_APP_VERSION})`);
        setTimeout(() => setToastMsg(null), 3500);
      }
    } catch {
      setToastMsg("Impossible de vérifier les mises à jour actuellement");
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleClearCacheWithToast = () => {
    onClearRoomCache();
    setToastMsg("Cache des cours vidé");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleResetDatabaseWithToast = () => {
    onResetDatabase();
    setToastMsg("Programme réinitialisé");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const roomRepo = RoomDatabaseRepository.getInstance();
    const loadData = () => {
      setTransactions(roomRepo.getAllTransactions());
      const reqs = roomRepo.getClassChangeRequestsByUser(user.uid);
      const pending = reqs.find((r) => r.status === "pending") || null;
      setPendingRequest(pending);
    };
    loadData();
    return roomRepo.subscribe(loadData);
  }, [user.uid]);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          onUpdatePhoto(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayNameInput.trim()) {
      onUpdateProfile({ displayName: displayNameInput.trim() });
      setIsEditingName(false);
    }
  };

  const handleLevelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLvl = e.target.value as SecondaryLevel;
    if (newLvl !== user.level) {
      setTargetLevel(newLvl);
      setClassChangeReason("");
      setClassChangeReasonError("");
      setShowLevelConfirm(true);
    }
  };

  const handleSendClassChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLevel) return;

    if (user.isAdmin) {
      // Admin can switch directly
      onUpdateLevel(targetLevel);
      setShowLevelConfirm(false);
      setTargetLevel(null);
      setClassChangeReason("");
      return;
    }

    if (!classChangeReason.trim()) {
      setClassChangeReasonError("Veuillez indiquer le motif de votre demande de changement de classe.");
      return;
    }

    roomRepo.createClassChangeRequest(
      user.uid,
      user.displayName,
      user.email,
      user.level,
      targetLevel,
      classChangeReason.trim()
    );

    setShowLevelConfirm(false);
    setClassChangeReason("");
    setClassChangeReasonError("");
    setToastMsg(`Votre demande de passage en classe de ${targetLevel} a été transmise à l'administration.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    const savedAdminPass = roomRepo.getAdminPassword();
    const isDefaultAdminPass = savedAdminPass === "Perpendiculaire @2026";
    const currentPwd = user.password || (user.isAdmin ? savedAdminPass : "1717");
    const cleanOld = oldPasswordInput.trim();
    
    // Strict validation: cleanOld must match current password. Default admin pass only allowed if admin pass hasn't been changed yet.
    const isOldValid = cleanOld === currentPwd || (user.isAdmin && isDefaultAdminPass && (cleanOld === "Perpendiculaire @2026" || cleanOld === "Perpendiculaire@2026"));

    if (!isOldValid) {
      setPasswordError("Ancien mot de passe incorrect.");
      return;
    }

    const isValidPassword = (pwd: string) => /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(pwd);

    if (!isValidPassword(newPasswordInput)) {
      setPasswordError("Le nouveau mot de passe doit comporter au moins 8 caractères (lettres et chiffres).");
      return;
    }

    const cleanNewPassword = newPasswordInput.trim();

    try {
      await updateUserPasswordFirebase(cleanNewPassword);
    } catch (err) {
      console.warn("Firebase update password notice:", err);
    }

    // Uniquely update local storage profile & admin credentials
    onUpdateProfile({ password: cleanNewPassword });
    if (user.isAdmin) {
      roomRepo.setAdminPassword(cleanNewPassword);
    }
    roomRepo.registerOrUpdateStudent({ ...user, password: cleanNewPassword });

    // Revoke current session and force immediate signout
    try {
      await signOutFirebase();
    } catch (e) {
      console.warn("Signout error:", e);
    }

    setPasswordSuccess("Votre mot de passe a été modifié avec succès ! L'ancien mot de passe a été totalement révoqué. Veuillez vous réauthentifier avec le nouveau mot de passe.");
    setOldPasswordInput("");
    setNewPasswordInput("");
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordSuccess("");
      roomRepo.clearUserProfile();
      onLogout();
    }, 2000);
  };

  const handleCancelPassword = () => {
    setIsChangingPassword(false);
    setOldPasswordInput("");
    setNewPasswordInput("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    setPasswordError("");
    setPasswordSuccess("");
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Hidden image file input for phone gallery/camera */}
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        onChange={handlePhotoFileChange}
        className="hidden"
      />

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 text-center shadow-xs space-y-4 relative transition-colors">
        <div className="relative w-24 h-24 mx-auto group cursor-pointer" onClick={() => photoInputRef.current?.click()}>
          <img
            src={
              user.photoUrl ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
            }
            alt={user.displayName}
            className="w-24 h-24 rounded-full object-cover border-4 border-[#1A237E] dark:border-amber-400 shadow-md mx-auto group-hover:opacity-90 transition-opacity"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              photoInputRef.current?.click();
            }}
            className="absolute bottom-0 right-0 p-2 bg-[#1A237E] dark:bg-amber-400 text-white dark:text-slate-950 rounded-full shadow hover:bg-indigo-900 dark:hover:bg-amber-300 transition-colors cursor-pointer"
            title="Insérer une photo depuis le téléphone"
          >
            <Camera size={14} />
          </button>
        </div>

        <div>
          {!isEditingName ? (
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {user.displayName}
                </h2>
                <button
                  onClick={() => {
                    setDisplayNameInput(user.displayName);
                    setIsEditingName(true);
                  }}
                  className="p-1 text-slate-400 hover:text-[#1A237E] dark:hover:text-amber-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Modifier le Nom et Prénom"
                >
                  <Edit2 size={15} />
                </button>
              </div>

              {user.isAdmin && (
                <span className="inline-block px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black rounded-full border border-amber-300 dark:border-amber-700">
                  ADMIN (Massaw Seck)
                </span>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          ) : (
            <form onSubmit={handleSaveName} className="max-w-xs mx-auto bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-left animate-in fade-in">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Nom et Prénom :</label>
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  required
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="Ex: Massaw Seck"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-[#1A237E]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#1A237E] dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold rounded-xl hover:bg-indigo-900 dark:hover:bg-amber-300 transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Check size={14} />
                  <span>Enregistrer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </form>
          )}

          {/* Quick Photo Upload Trigger Button */}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-[#1A237E] dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Upload size={13} />
            <span>Changer la photo (depuis le téléphone)</span>
          </button>
        </div>

        {/* Level selector */}
        <div className="bg-indigo-50/80 rounded-2xl p-4 border border-indigo-100 space-y-3 text-left">
          <label className="text-xs font-bold text-[#1A237E] flex items-center space-x-1.5">
            <GraduationCap size={16} />
            <span>Classe / Niveau d'Étude Actuel (Filtrage Strict) :</span>
          </label>

          <select
            value={user.level}
            onChange={handleLevelSelect}
            className="w-full bg-white border-2 border-indigo-200 rounded-xl p-2.5 text-sm font-extrabold text-[#1A237E] focus:outline-none focus:border-[#1A237E]"
          >
            {ALL_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                Classe de {lvl} {lvl === "3ème" ? "(Prépa BFEM)" : lvl === "Terminale" ? "(Prépa BAC)" : ""}
              </option>
            ))}
          </select>

          {pendingRequest ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <Hourglass size={15} className="text-amber-600 animate-pulse shrink-0" />
                <span>Demande de changement de classe en cours de traitement</span>
              </div>
              <p className="text-[11px] leading-snug text-amber-800">
                Vous avez demandé le passage de la classe de <strong>{pendingRequest.currentLevel}</strong> à <strong>{pendingRequest.requestedLevel}</strong>.
                Motif : <em>"{pendingRequest.reason}"</em>. L'administration étudie votre dossier. Vous restez pour l'instant en classe de <strong>{user.level}</strong>.
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-indigo-900/80 leading-relaxed italic">
              <strong>Demande d'autorisation : </strong>Pour passer en classe supérieure ou changer de filière, choisissez une classe ci-dessus pour envoyer une demande à l'administration.
            </p>
          )}
        </div>
      </div>

      {/* Section Changer mon mot de passe */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-[#1A237E] dark:text-indigo-300 flex items-center justify-center font-bold shrink-0">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Sécurité du Compte</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Modifier votre mot de passe</p>
            </div>
          </div>

          {!isChangingPassword && (
            <button
              type="button"
              onClick={() => {
                setIsChangingPassword(true);
                setPasswordError("");
                setPasswordSuccess("");
              }}
              className="px-3.5 py-2 bg-[#1A237E] dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold rounded-xl hover:bg-indigo-900 dark:hover:bg-amber-300 transition-colors cursor-pointer flex items-center space-x-1.5 shadow-xs"
            >
              <Lock size={14} />
              <span>Changer mon mot de passe</span>
            </button>
          )}
        </div>

        {isChangingPassword && (
          <form onSubmit={handleSavePassword} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            {passwordError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center space-x-1.5">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center space-x-1.5">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Ancien mot de passe :
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type={showOldPassword ? "text" : "password"}
                  required
                  value={oldPasswordInput}
                  onChange={(e) => setOldPasswordInput(e.target.value)}
                  placeholder="Entrez votre ancien mot de passe"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-10 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-[#1A237E]"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showOldPassword ? "Masquer" : "Afficher"}
                >
                  {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nouveau mot de passe :
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Minimum 8 caractères (lettres + chiffres)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-10 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-[#1A237E]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showNewPassword ? "Masquer" : "Afficher"}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#1A237E] dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold rounded-xl hover:bg-indigo-900 dark:hover:bg-amber-300 transition-colors cursor-pointer flex items-center justify-center space-x-1 shadow-xs"
              >
                <Check size={14} />
                <span>Enregistrer</span>
              </button>
              <button
                type="button"
                onClick={handleCancelPassword}
                className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer flex items-center justify-center space-x-1"
              >
                <X size={14} />
                <span>Annuler</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Admin Space Protected Button */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#1A237E] font-black flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Espace Administrateur</h3>
            <p className="text-xs text-slate-600">Protégé par Code PIN • Massaw Seck</p>
          </div>
        </div>

        <button
          onClick={onOpenAdmin}
          className="px-3.5 py-2 bg-[#1A237E] hover:bg-indigo-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <Key size={14} />
          <span>Accéder à l'Admin</span>
        </button>
      </div>

      {/* Kotlin Source Code Button */}
      <div className="bg-indigo-900 text-white rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-800 text-amber-300 font-black flex items-center justify-center border border-indigo-700">
            <Code2 size={22} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Architecture & Code Kotlin Native</h3>
            <p className="text-xs text-indigo-200">Inspectez et copiez la source Android Room/Compose</p>
          </div>
        </div>

        <button
          onClick={onOpenCodeViewer}
          className="px-3.5 py-2 bg-amber-400 text-[#1A237E] hover:bg-amber-300 rounded-xl text-xs font-extrabold shadow-xs transition-colors"
        >
          Voir Code
        </button>
      </div>

      {/* Official Admin Contact Card */}
      <AdminContactCard />

      {/* Transactions Wave ou OM History Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                Transactions Wave ou OM
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Historique de vos opérations de transfert vers le 78 376 95 84
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-slate-800 text-[#1A237E] dark:text-indigo-300 font-bold text-[10px] rounded-full border border-indigo-200 dark:border-slate-700">
            {transactions.length} enregistrée(s)
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 space-y-1">
            <CreditCard size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium">Aucune transaction enregistrée pour le moment.</p>
            <p className="text-[11px] text-slate-400">
              Inscrivez-vous via les formulaires Renforcement ou Domicile.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-slate-100">
                      <span className="uppercase text-[10px] bg-indigo-100 dark:bg-indigo-950 text-[#1A237E] dark:text-indigo-300 px-2 py-0.5 rounded-md">
                        {tx.type === "renforcement" ? "Renforcement" : "Domicile"}
                      </span>
                      <span>• Apprenant : <strong className="text-[#1A237E] dark:text-amber-400">{tx.learnerName || tx.userName}</strong></span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Niveau {tx.level} • Mensualité : {tx.selectedMonth || "Actuelle"}
                    </p>
                  </div>

                  {/* Status Badge */}
                  {tx.status === "pending" && (
                    <span className="shrink-0 px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black rounded-full border border-amber-300 dark:border-amber-700 flex items-center space-x-1">
                      <Clock size={11} className="animate-spin" />
                      <span>En attente</span>
                    </span>
                  )}
                  {tx.status === "approved" && (
                    <span className="shrink-0 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black rounded-full border border-emerald-300 dark:border-emerald-700 flex items-center space-x-1">
                      <CheckCircle2 size={11} />
                      <span>Validé</span>
                    </span>
                  )}
                  {tx.status === "rejected" && (
                    <span className="shrink-0 px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-black rounded-full border border-rose-300 dark:border-rose-700 flex items-center space-x-1">
                      <XCircle size={11} />
                      <span>Rejeté</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-bold">
                    Opérateur : <span className="uppercase font-black text-amber-700 dark:text-amber-400">{tx.operator} Money</span> (78 376 95 84)
                  </span>
                  <span className="font-black text-[#1A237E] dark:text-amber-300 text-xs">
                    {tx.amount.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>

                <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-400">
                  <span>{tx.dateFormatted}</span>
                  {onOpenReceipt && (
                    <button
                      type="button"
                      onClick={() => onOpenReceipt(tx)}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-amber-400 rounded-lg font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <FileText size={11} className="text-[#1A237E] dark:text-amber-400" />
                      <span>Voir le Reçu</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Cache & Storage Management */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
          Actions sur la base de données Room Local :
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleClearCacheWithToast}
            className="p-3 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-left transition-colors group flex items-center justify-between cursor-pointer"
          >
            <div>
              <p className="font-bold text-slate-800 text-xs group-hover:text-rose-700">Vider le cache des cours</p>
              <p className="text-[10px] text-slate-500">Exécute clearCourses()</p>
            </div>
            <Trash2 size={16} className="text-slate-400 group-hover:text-rose-600" />
          </button>

          <button
            type="button"
            onClick={handleResetDatabaseWithToast}
            className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left transition-colors group flex items-center justify-between cursor-pointer"
          >
            <div>
              <p className="font-bold text-slate-800 text-xs group-hover:text-indigo-700">Réinitialiser les données</p>
              <p className="text-[10px] text-slate-500">Recharger le programme Sénégal</p>
            </div>
            <RefreshCw size={16} className="text-slate-400 group-hover:text-indigo-600" />
          </button>
        </div>

        {toastMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-extrabold text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}
      </div>

      {/* Logout & Delete Account buttons */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onLogout();
          }}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          <span>Déconnexion de la Session</span>
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteAccountConfirm(true)}
          className="w-full py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
        >
          <Trash2 size={16} />
          <span>Supprimer définitivement mon compte</span>
        </button>
      </div>

      {/* Discreet Version Tag and Branding */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <img src={appLogo} alt="Savoir+ Logo" className="w-5 h-5 rounded-md object-cover border border-amber-300" />
          <span className="text-xs font-bold text-[#1A237E] dark:text-indigo-300">Savoir+ Sénégal</span>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700">
            v{CURRENT_APP_VERSION}
          </span>
          <button
            type="button"
            onClick={handleManualUpdateCheck}
            disabled={isCheckingUpdate}
            className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-[#1A237E] dark:text-indigo-300 text-[10px] font-extrabold rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center space-x-1 cursor-pointer transition-colors"
            title="Vérifier les mises à jour"
          >
            <RefreshCw size={10} className={isCheckingUpdate ? "animate-spin" : ""} />
            <span>Mises à jour</span>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          Encadrement Pédagogique & Réussite Scolaire • Version {CURRENT_APP_VERSION} (Offline-First)
        </p>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full mx-auto flex items-center justify-center">
              <Trash2 size={28} />
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Supprimer votre compte Savoir+ ?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Cette action est <strong>irréversible</strong>. Votre profil (<code>users/{user.uid}</code>), votre compte Firebase Auth, vos demandes d'abonnement et notifications seront définitivement supprimés en cascade dans Firestore et localement.
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteAccountConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={async (e) => {
                  e.preventDefault();
                  setIsDeletingAccount(true);
                  try {
                    roomRepo.deleteStudent(user.uid);
                    onLogout();
                  } catch (err) {
                    console.error("Error deleting self account:", err);
                  } finally {
                    setIsDeletingAccount(false);
                    setShowDeleteAccountConfirm(false);
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {isDeletingAccount ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>Supprimer Mon Compte</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Change Confirmation / Request Modal */}
      {showLevelConfirm && targetLevel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left animate-in zoom-in-95">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <div className="w-11 h-11 bg-indigo-100 text-[#1A237E] rounded-2xl flex items-center justify-center shrink-0 font-bold">
                <GraduationCap size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Demande de Changement de Classe</h3>
                <p className="text-[11px] text-slate-500">
                  {user.isAdmin ? "Modification directe (Admin)" : "Soumettre une demande à l'administration"}
                </p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 text-xs text-[#1A237E] space-y-1">
              <div className="flex justify-between font-bold">
                <span>Classe actuelle : <strong>{user.level}</strong></span>
                <span>Nouvelle classe : <strong className="text-emerald-700">{targetLevel}</strong></span>
              </div>
              <p className="text-[10px] text-indigo-900/70">
                {user.isAdmin
                  ? "En tant qu'Admin, le changement est immédiat."
                  : "Votre demande sera envoyée à l'administration. En attendant sa validation, vous conservez l'accès à vos cours de " + user.level + "."}
              </p>
            </div>

            {!user.isAdmin ? (
              <form onSubmit={handleSendClassChangeRequest} className="space-y-3">
                {classChangeReasonError && (
                  <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-1.5 font-medium">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{classChangeReasonError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Motif de la demande de changement de classe <span className="text-red-500">*</span> :
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={classChangeReason}
                    onChange={(e) => {
                      setClassChangeReason(e.target.value);
                      if (classChangeReasonError) setClassChangeReasonError("");
                    }}
                    placeholder="Précisez la raison de votre demande (ex : Erreur de choix lors de l'inscription, passage en classe supérieure, changement de série...)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#1A237E] resize-none"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLevelConfirm(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#1A237E] hover:bg-indigo-900 text-white text-xs font-extrabold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Send size={14} />
                    <span>Envoyer la Demande</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Confirmez-vous le passage à la classe de <strong>{targetLevel}</strong> ? Cela effacera le cache local et réinitialisera la session.
                </p>
                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLevelConfirm(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLevelConfirm(false);
                      onUpdateLevel(targetLevel);
                    }}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-colors"
                  >
                    Confirmer & Réinitialiser
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
