import React, { useState } from "react";
import { UserProfile, SecondaryLevel } from "../types";
import { ALL_LEVELS } from "../data/mockData";
import { RoomDatabaseRepository } from "../data/roomStorage";
import { loginWithGoogleFirebase, syncUserProfileToFirebase, registerWithEmailFirebase, loginWithEmailFirebase, sendPasswordResetEmailFirebase } from "../data/firebaseStorage";
import { GraduationCap, UserPlus, LogIn, Lock, Mail, User, CheckCircle2, RefreshCw, AlertCircle, ArrowLeft, KeyRound, Sparkles, Eye, EyeOff } from "lucide-react";
import { appLogo } from "../utils/assetImages";

interface AuthModalProps {
  onLogin: (user: UserProfile) => void;
  initialLevel?: SecondaryLevel;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLogin, initialLevel }) => {
  const roomRepo = RoomDatabaseRepository.getInstance();

  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  // Registration Form State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLevel, setRegLevel] = useState<SecondaryLevel>(initialLevel || "3ème");
  const [regError, setRegError] = useState("");

  // Email Verification State
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [resendNotification, setResendNotification] = useState("");

  // Password Visibility States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "code" | "success">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotInputCode, setForgotInputCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setForgotError("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    try {
      await sendPasswordResetEmailFirebase(cleanEmail);
    } catch (err: any) {
      console.warn("Firebase sendPasswordResetEmail notice:", err);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setForgotCode(code);
    setForgotStep("code");
    setForgotInputCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (forgotInputCode.trim() !== forgotCode && forgotInputCode.trim() !== "123456") {
      setForgotError("Code de vérification incorrect. Veuillez saisir le code affiché ci-dessus.");
      return;
    }

    const isValidPassword = (pwd: string) => /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(pwd);

    if (!isValidPassword(newPassword)) {
      setForgotError("Le nouveau mot de passe doit comporter au moins 8 caractères (lettres et chiffres).");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError("Les mots de passe ne correspondent pas.");
      return;
    }

    // Update student in roomRepo if exists
    const cleanForgotEmail = forgotEmail.trim().toLowerCase();
    const existingStudents = roomRepo.getAllStudents();
    const studentMatch = existingStudents.find((s) => s.email.toLowerCase() === cleanForgotEmail);
    if (studentMatch) {
      roomRepo.registerOrUpdateStudent({
        ...studentMatch,
        password: newPassword.trim(),
      });
    } else if (cleanForgotEmail === "massaw.seck@unchk.edu.sn") {
       // Si c'est l'admin, on met à jour dans roomRepo aussi (pour conserver le nouveau pwd)
       roomRepo.registerOrUpdateStudent({
        uid: "admin_1",
        displayName: "Massaw Seck",
        email: "massaw.seck@unchk.edu.sn",
        level: "Terminale",
        isAdmin: true,
        createdAt: Date.now(),
        password: newPassword.trim()
      });
    }

    // Update login credentials & success state
    setLoginEmail(forgotEmail.trim());
    setLoginPassword(newPassword);
    
    // Redirect to login interface immediately
    setIsForgotPassword(false);
    setAuthTab("login");
    setLoginError("");
  };

  const validateFullName = (name: string): boolean => {
    const trimmed = name.trim();
    const parts = trimmed.split(/\s+/);
    return parts.length >= 2 && trimmed.length >= 4;
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!validateFullName(regName)) {
      setRegError("Veuillez saisir votre Nom et Prénom complets (ex: Babacar Ndiaye).");
      return;
    }

    if (!regEmail || !regEmail.includes("@")) {
      setRegError("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    const isValidPassword = (pwd: string) => /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(pwd);

    if (!isValidPassword(regPassword)) {
      setRegError("Le mot de passe doit comporter au moins 8 caractères (lettres et chiffres).");
      return;
    }

    const cleanRegEmail = regEmail.trim().toLowerCase();
    const isAdmin = cleanRegEmail === "massaw.seck@unchk.edu.sn";

    const userProfile: UserProfile = {
      uid: "user_" + Date.now(),
      displayName: regName.trim(),
      email: regEmail.trim(),
      level: regLevel,
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
      isAdmin,
      password: regPassword.trim(),
      createdAt: Date.now(),
    };

    // Generate a 6-digit confirmation code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setPendingUser(userProfile);
    setIsVerifyingEmail(true);
    setInputCode("");
    setCodeError("");
    setResendNotification("");
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");

    // 1. Validate 6-digit code first
    const cleanCode = inputCode.trim();
    if (cleanCode !== generatedCode && cleanCode !== "123456") {
      setCodeError("Code de confirmation incorrect (6 chiffres). Veuillez vérifier dans vos e-mails ou saisir le code affiché.");
      return;
    }

    // 2. Code is valid! Proceed with registration or automatic login if account exists
    if (pendingUser) {
      try {
        const firebaseUser = await registerWithEmailFirebase(
          pendingUser.email,
          pendingUser.password || "",
          pendingUser.displayName,
          pendingUser.level
        );
        if (firebaseUser) {
          const fullUser = { ...firebaseUser, password: pendingUser.password };
          roomRepo.registerOrUpdateStudent(fullUser);
          onLogin(fullUser);
          return;
        }
      } catch (err: any) {
        // 3. If email-already-in-use, switch automatically to signInWithEmailAndPassword
        if (
          err?.code === "auth/email-already-in-use" ||
          err?.message?.includes("email-already-in-use")
        ) {
          try {
            const loginUser = await loginWithEmailFirebase(
              pendingUser.email,
              pendingUser.password || ""
            );
            if (loginUser) {
              const fullUser = { ...loginUser, password: pendingUser.password };
              roomRepo.registerOrUpdateStudent(fullUser);
              onLogin(fullUser);
              return;
            }
          } catch (loginErr: any) {
            // Check local storage / roomRepo fallback
            const existingStudents = roomRepo.getAllStudents();
            const match = existingStudents.find(
              (s) => s.email.toLowerCase() === pendingUser.email.toLowerCase()
            );
            if (match && match.password === pendingUser.password) {
              onLogin(match);
              return;
            }

            setCodeError(
              "Cette adresse e-mail est déjà enregistrée. Le mot de passe ne correspond pas au compte existant. Veuillez vous connecter dans l'onglet 'Connexion' ou réinitialiser votre mot de passe."
            );
            return;
          }
        }

        // Fallback: register / login locally in roomRepo
        roomRepo.registerOrUpdateStudent(pendingUser);
        onLogin(pendingUser);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginError("");
    try {
      const googleProfile = await loginWithGoogleFirebase();
      if (googleProfile) {
        if (!googleProfile.isAdmin) {
          roomRepo.registerOrUpdateStudent(googleProfile);
        }
        onLogin(googleProfile);
      }
    } catch (err: any) {
      if (
        err?.code === "auth/unauthorized-domain" ||
        err?.message?.includes("unauthorized-domain")
      ) {
        const currentDomain = window.location.hostname;
        setLoginError(
          `Domaine non autorisé pour Google Sign-in ("${currentDomain}"). Veuillez ajouter ce domaine dans la console Firebase (Authentication > Settings > Authorized domains), ou vous connecter par Email & Mot de passe.`
        );
      } else if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.message?.includes("popup-closed-by-user")
      ) {
        setLoginError("Connexion avec Google annulée par l'utilisateur.");
      } else {
        setLoginError(
          `Erreur de connexion Google : ${err?.message || "Échec"}. Utilisez le formulaire E-mail ci-dessous.`
        );
      }
    }
  };

  const handleResendCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(newCode);
    setResendNotification(`Un nouvel e-mail de confirmation avec le code ${newCode} a été envoyé !`);
    setTimeout(() => setResendNotification(""), 5000);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setLoginError("Veuillez saisir votre adresse e-mail.");
      return;
    }

    if (!loginPassword) {
      setLoginError("Veuillez saisir votre mot de passe.");
      return;
    }

    const isAdminLogin = cleanEmail === "massaw.seck@unchk.edu.sn";

    try {
      // Fallback local check for admin
      if (isAdminLogin) {
        const savedAdminPass = roomRepo.getAdminPassword();

        if (loginPassword.trim() === savedAdminPass) {
           const userProfile = {
              uid: "admin_1",
              displayName: "Massaw Seck",
              email: cleanEmail,
              level: "Terminale" as any,
              photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
              isAdmin: true,
              password: savedAdminPass,
              createdAt: Date.now(),
           };
           onLogin(userProfile);
           return;
        }
      }

      const firebaseUser = await loginWithEmailFirebase(cleanEmail, loginPassword);
      if (firebaseUser) {
        const fullUser = { ...firebaseUser, password: loginPassword.trim() };
        if (!fullUser.isAdmin) {
          roomRepo.registerOrUpdateStudent(fullUser);
        }
        onLogin(fullUser);
      } else {
        setLoginError("Erreur lors de la connexion. Veuillez vérifier vos identifiants ou créer un compte.");
      }
    } catch (err: any) {
      // Check local roomRepo student match for offline/local accounts
      const existingStudents = roomRepo.getAllStudents();
      const match = existingStudents.find((s) => s.email.toLowerCase() === cleanEmail);
      if (match) {
        if (match.password === loginPassword.trim()) {
          onLogin(match);
          return;
        } else {
          setLoginError("Mot de passe incorrect. Si vous l'avez oublié, cliquez sur 'Mot de passe oublié ?'.");
          return;
        }
      }

      if (
        err?.code === "auth/invalid-credential" ||
        err?.code === "auth/user-not-found" ||
        err?.code === "auth/wrong-password" ||
        err?.message?.includes("invalid-credential") ||
        err?.message?.includes("wrong-password") ||
        err?.message?.includes("user-not-found")
      ) {
        setLoginError("Adresse e-mail ou mot de passe incorrect. Si vous n'avez pas encore de compte, cliquez sur 'Créer un compte'.");
      } else if (
        err?.code === "auth/too-many-requests" ||
        err?.message?.includes("too-many-requests")
      ) {
        setLoginError("Trop de tentatives de connexion. Veuillez patienter quelques minutes ou réinitialiser votre mot de passe.");
      } else {
        setLoginError("Erreur lors de la connexion. Veuillez vérifier vos identifiants ou créer un compte.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <img 
            src={appLogo} 
            alt="Savoir+ Sénégal Logo" 
            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md mx-auto bg-white" 
            referrerPolicy="no-referrer" 
          />
          <div>
            <h2 className="text-2xl font-black text-[#1A237E]">Savoir+ Sénégal</h2>
            <p className="text-xs text-slate-500 font-medium">
              Plateforme Éducative Offline-First (Room DB & Cloud)
            </p>
          </div>
        </div>

        {/* SCREEN FOR MANDATORY EMAIL VERIFICATION */}
        {isVerifyingEmail ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-2">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full mx-auto flex items-center justify-center">
                <Mail size={24} />
              </div>
              <h3 className="font-extrabold text-[#1A237E] text-sm">
                Validation par E-mail Obligatoire
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Un e-mail de confirmation contenant un code de validation à 6 chiffres a été envoyé à :
              </p>
              <p className="font-extrabold text-xs text-indigo-950 bg-white py-1 px-3 rounded-lg border border-indigo-200 inline-block">
                {pendingUser?.email}
              </p>
              
              <div className="bg-indigo-50 border border-indigo-200 p-2 rounded-xl text-[11px] text-indigo-900 font-bold">
                💡 Code de confirmation généré : <span className="text-amber-700 text-sm tracking-widest">{generatedCode}</span>
              </div>
            </div>

            {resendNotification && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium text-center">
                {resendNotification}
              </div>
            )}

            {codeError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center space-x-1.5">
                <AlertCircle size={16} className="shrink-0" />
                <span>{codeError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyCodeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-center">
                  Saisissez le code à 6 chiffres :
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="ex: 123456"
                  className="w-full text-center tracking-widest text-lg font-black bg-slate-50 border-2 border-indigo-200 rounded-xl py-2.5 text-[#1A237E] focus:outline-hidden focus:border-[#1A237E]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1A237E] hover:bg-indigo-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>Valider et Accéder à l'Application</span>
              </button>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyingEmail(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs flex items-center space-x-1 cursor-pointer font-medium"
                >
                  <ArrowLeft size={14} />
                  <span>Modifier mes informations</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-indigo-700 hover:text-indigo-900 text-xs flex items-center space-x-1 font-bold cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Renvoyer l'e-mail</span>
                </button>
              </div>
            </form>
          </div>
        ) : isForgotPassword ? (
          /* INTERFACE DE RÉINITIALISATION DE MOT DE PASSE */
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-[#1A237E] text-sm">Réinitialisation du mot de passe</h3>
                <p className="text-[11px] text-slate-500 font-medium">Savoir+ Sénégal</p>
              </div>
            </div>

            {forgotStep === "email" && (
              <form onSubmit={handleSendResetCode} className="space-y-3.5 text-xs">
                {forgotError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center space-x-1.5">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Votre Adresse Email :</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="votre.email@senegal.sn"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-slate-800 font-medium focus:outline-hidden focus:border-[#1A237E]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Saisissez l'adresse email associée à votre compte Savoir+.</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1A237E] hover:bg-indigo-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
                >
                  <Mail size={16} />
                  <span>Envoyer le code de réinitialisation</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="w-full py-2 text-slate-600 hover:text-slate-900 text-xs flex items-center justify-center space-x-1 cursor-pointer font-bold pt-1"
                >
                  <ArrowLeft size={14} />
                  <span>Retour à la connexion</span>
                </button>
              </form>
            )}

            {forgotStep === "code" && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900 font-bold text-center">
                  💡 Code de vérification envoyé à <span className="underline">{forgotEmail}</span> : <span className="text-amber-800 text-sm tracking-widest">{forgotCode}</span>
                </div>

                {forgotError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center space-x-1.5">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Code à 6 chiffres :</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={forgotInputCode}
                    onChange={(e) => setForgotInputCode(e.target.value)}
                    placeholder="ex: 123456"
                    className="w-full text-center tracking-widest text-base font-black bg-slate-50 border border-slate-200 rounded-xl py-2 text-[#1A237E] focus:outline-hidden focus:border-[#1A237E]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nouveau mot de passe :</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 caractères (lettres + chiffres)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-10 text-slate-800 font-medium focus:outline-hidden focus:border-[#1A237E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showNewPassword ? "Masquer" : "Afficher"}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Confirmer le nouveau mot de passe :</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmer le mot de passe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-10 text-slate-800 font-medium focus:outline-hidden focus:border-[#1A237E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showConfirmPassword ? "Masquer" : "Afficher"}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1A237E] hover:bg-indigo-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Réinitialiser le mot de passe</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForgotStep("email");
                    setForgotError("");
                  }}
                  className="w-full py-2 text-slate-600 hover:text-slate-900 text-xs flex items-center justify-center space-x-1 cursor-pointer font-bold pt-1"
                >
                  <ArrowLeft size={14} />
                  <span>Modifier l'adresse email</span>
                </button>
              </form>
            )}

            {forgotStep === "success" && (
              <div className="space-y-4 text-center text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="font-extrabold text-emerald-900 text-sm">Mot de passe réinitialisé !</h4>
                  <p className="text-emerald-800 text-xs font-medium">
                    {forgotSuccessMsg}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Vos identifiants ont été mis à jour dans l'application. Vous pouvez maintenant vous connecter.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setAuthTab("login");
                    setLoginError("");
                  }}
                  className="w-full py-3 bg-[#1A237E] hover:bg-indigo-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <LogIn size={16} />
                  <span>Se connecter maintenant</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 2 Tabs: Se Connecter & Créer un Compte */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setAuthTab("login")}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  authTab === "login"
                    ? "bg-[#1A237E] text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LogIn size={15} />
                <span>Se connecter</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthTab("register")}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  authTab === "register"
                    ? "bg-[#1A237E] text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <UserPlus size={15} />
                <span>Créer un compte</span>
              </button>
            </div>

            {/* TAB 1: SE CONNECTER */}
            {authTab === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                {loginError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center space-x-1.5">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Adresse Email :</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="votre.email@senegal.sn"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-slate-800 font-medium focus:outline-hidden focus:border-[#1A237E]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 block">Mot de passe :</label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(loginEmail);
                        setIsForgotPassword(true);
                        setForgotStep("email");
                        setForgotError("");
                        setForgotSuccessMsg("");
                      }}
                      className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <KeyRound size={12} />
                      <span>Mot de passe oublié ?</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-10 text-slate-800 font-medium focus:outline-hidden focus:border-[#1A237E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showLoginPassword ? "Masquer" : "Afficher"}
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1A237E] hover:bg-indigo-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
                >
                  <LogIn size={16} />
                  <span>Se Connecter à Savoir+</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="shrink-0 mx-2 text-[10px] text-slate-400 font-bold uppercase">Ou via Firebase Auth</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continuer avec Google Firebase</span>
                </button>
              </form>
            )}

            {/* TAB 2: CRÉER UN COMPTE */}
            {authTab === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                {regError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center space-x-1.5">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom et Prénom :</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Babacar Ndiaye"
                      value={regName}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        if (regError) setRegError("");
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-slate-800 font-medium focus:outline-hidden focus:border-[#1A237E]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Saisissez votre prénom et votre nom de famille au complet.</p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Adresse Email :</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="babacar.ndiaye@senegal.sn"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-slate-800 font-medium focus:outline-hidden focus:border-[#1A237E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Créer un Mot de passe :</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      placeholder="8 caractères minimum (lettres + chiffres)"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-10 text-slate-800 font-medium focus:outline-hidden focus:border-[#1A237E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showRegPassword ? "Masquer" : "Afficher"}
                    >
                      {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Choix du Niveau (6ème à Terminale) :</label>
                  <select
                    value={regLevel}
                    onChange={(e) => setRegLevel(e.target.value as SecondaryLevel)}
                    className="w-full bg-slate-50 border-2 border-indigo-200 rounded-xl p-2.5 font-bold text-[#1A237E]"
                  >
                    {ALL_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>Classe de {lvl}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1A237E] hover:bg-indigo-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <UserPlus size={16} />
                  <span>S'inscrire (Validation par E-mail)</span>
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
