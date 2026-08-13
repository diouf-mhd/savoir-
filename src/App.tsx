import React, { useState, useEffect } from "react";
import { RoomDatabaseRepository } from "./data/roomStorage";
import { UserProfile, Course, Asset, Quiz, SecondaryLevel, Subject, PaymentTransaction } from "./types";
import { Header } from "./components/Header";
import { Navigation, NavTab } from "./components/Navigation";
import { HomeTab } from "./components/HomeTab";
import { CoursesTab } from "./components/CoursesTab";
import { ExercisesTab } from "./components/ExercisesTab";
import { QuizTab } from "./components/QuizTab";
import { ProfileTab } from "./components/ProfileTab";
import { AdminModal } from "./components/AdminModal";
import { KotlinCodeViewer } from "./components/KotlinCodeViewer";
import { AuthModal } from "./components/AuthModal";
import { ReceiptModal } from "./components/ReceiptModal";
import { NotificationModal } from "./components/NotificationModal";
import { UpdateModal } from "./components/UpdateModal";
import { checkForAppUpdates, UpdateCheckResult } from "./utils/versionUtils";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { getUserProfileFromFirebase } from "./data/firebaseStorage";

export default function App() {
  const roomRepo = RoomDatabaseRepository.getInstance();

  const [user, setUser] = useState<UserProfile | null>(() => roomRepo.getUserProfile());
  const [authDefaultLevel, setAuthDefaultLevel] = useState<SecondaryLevel>("3ème");
  const [activeTab, setActiveTab] = useState<NavTab>("accueil");
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);

  // Modals for Receipts, Notifications, and App Updates
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<PaymentTransaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // App Update Modal State
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Check for updates on startup / login
  useEffect(() => {
    let isMounted = true;
    checkForAppUpdates().then((res) => {
      if (isMounted && res.hasUpdate) {
        setUpdateInfo(res);
        setIsUpdateModalOpen(true);
      }
    }).catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Subscribe to Room database state updates
  useEffect(() => {
    const refreshData = () => {
      const u = roomRepo.getUserProfile();
      setUser(u);
      if (u) {
        setCourses(roomRepo.getCoursesByLevel(u.level));
        setAssets(roomRepo.getAllAssets());
        setQuizzes(roomRepo.getQuizzesByLevel(u.level));
      } else {
        setCourses([]);
        setQuizzes([]);
      }

      // Refresh notification count
      const notifs = u ? roomRepo.getNotificationsByUser(u.uid) : [];
      const unread = notifs.filter((n) => n.status === "unread").length;
      setUnreadNotifCount(unread);
    };

    refreshData();
    const unsubscribe = roomRepo.subscribe(refreshData);
    return () => {
      unsubscribe();
    };
  }, [user?.level]);

  // Firebase session persistence listener (optimistic loading with background sync)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 1. Immediately render local profile if available in Room repository
        const cachedUser = roomRepo.getUserProfile();
        if (cachedUser && (cachedUser.uid === firebaseUser.uid || cachedUser.email.toLowerCase() === (firebaseUser.email || "").toLowerCase())) {
          setUser(cachedUser);
        }

        // 2. Background Firestore sync with 3-second network timeout limit
        setIsSyncing(true);
        try {
          const remoteProfile = await getUserProfileFromFirebase(firebaseUser.uid);
          if (remoteProfile) {
            roomRepo.setUserProfile(remoteProfile);
            setUser(remoteProfile);
          }
        } catch (err) {
          console.warn("Background auth profile sync notice:", err);
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Handler for level change as required by prompt
  const handleUpdateLevel = (newLevel: SecondaryLevel) => {
    // 1. Clear local courses cache
    roomRepo.clearCourses();
    // 2. Clear user session/profile in repository and disconnect session
    roomRepo.clearUserProfile();
    setAuthDefaultLevel(newLevel);
    setUser(null);
    setActiveTab("accueil");
  };

  const handleLogout = () => {
    roomRepo.clearUserProfile();
    setUser(null);
    setActiveTab("accueil");
  };

  const handleLogin = (newUser: UserProfile) => {
    roomRepo.setUserProfile(newUser);
    setUser(newUser);
  };

  const handleUpdatePhoto = (newPhotoUrl: string) => {
    const updated = roomRepo.updateUserProfile({ photoUrl: newPhotoUrl });
    if (updated) {
      setUser(updated);
      roomRepo.registerOrUpdateStudent(updated);
    }
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    const updated = roomRepo.updateUserProfile(updates);
    if (updated) {
      setUser(updated);
      roomRepo.registerOrUpdateStudent(updated);
    }
  };

  const handleClearRoomCache = () => {
    roomRepo.clearCourses();
    roomRepo.clearAssets();
    if (user) {
      setCourses([]);
      setAssets([]);
    }
  };

  const handleResetDatabase = () => {
    roomRepo.resetToDefault();
    if (user) {
      setCourses(roomRepo.getCoursesByLevel(user.level));
      setAssets(roomRepo.getAllAssets());
      setQuizzes(roomRepo.getQuizzesByLevel(user.level));
    }
  };

  const handleToggleCacheAsset = (assetId: string) => {
    roomRepo.toggleAssetOfflineCache(assetId);
  };

  const handleTriggerSyncWorker = async () => {
    if (!user) return;
    setIsSyncing(true);
    await roomRepo.runSyncWorker(user.level);
    setIsSyncing(false);
  };

  const handleAddCourse = (course: Course) => {
    roomRepo.insertCourses([course]);
  };

  const handleAddAsset = (asset: Asset) => {
    roomRepo.insertAssets([asset]);
  };

  const handleAddQuiz = (quiz: Quiz) => {
    roomRepo.insertQuiz(quiz);
  };

  if (!user) {
    return <AuthModal onLogin={handleLogin} initialLevel={authDefaultLevel} />;
  }

  const handleOpenReceipt = (tx: PaymentTransaction) => {
    setSelectedReceiptTx(tx);
    setIsReceiptOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-[#1A237E] selection:text-white">
      {/* Night Blue Header */}
      <Header
        user={user}
        isOfflineMode={isOfflineMode}
        onToggleOffline={() => setIsOfflineMode(!isOfflineMode)}
        onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
        isCodeViewerOpen={isCodeViewerOpen}
        unreadNotifCount={unreadNotifCount}
        onOpenNotifications={() => setIsNotifOpen(true)}
        isSyncing={isSyncing}
      />

      {/* Main Screen Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4">
        {activeTab === "accueil" && (
          <HomeTab
            user={user}
            courses={courses}
            quizzes={quizzes}
            onSelectCourse={(course) => {
              setSelectedCourse(course);
              setActiveTab("cours");
            }}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onTriggerSyncWorker={handleTriggerSyncWorker}
            isSyncing={isSyncing}
            onOpenReceipt={handleOpenReceipt}
          />
        )}

        {activeTab === "cours" && (
          <CoursesTab
            userLevel={user.level}
            courses={courses}
            assets={assets}
            selectedCourse={selectedCourse}
            onSelectCourse={(course) => setSelectedCourse(course)}
            onToggleCacheAsset={handleToggleCacheAsset}
            onStartQuizForSubject={(subject) => {
              setActiveTab("quiz");
            }}
            isAdmin={user.isAdmin}
          />
        )}

        {activeTab === "exercices" && (
          <ExercisesTab
            userLevel={user.level}
            assets={assets}
            onToggleCacheAsset={handleToggleCacheAsset}
            isAdmin={user.isAdmin}
          />
        )}

        {activeTab === "quiz" && (
          <QuizTab
            userLevel={user.level}
            quizzes={quizzes}
            isAdmin={user.isAdmin}
          />
        )}

        {activeTab === "profil" && (
          <ProfileTab
            user={user}
            onUpdateLevel={handleUpdateLevel}
            onUpdatePhoto={handleUpdatePhoto}
            onUpdateProfile={handleUpdateProfile}
            onClearRoomCache={handleClearRoomCache}
            onResetDatabase={handleResetDatabase}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
            onLogout={handleLogout}
            onOpenReceipt={handleOpenReceipt}
          />
        )}
      </main>

      {/* Material 3 Bottom Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t)}
        userLevel={user.level}
      />

      {/* Admin Space Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onAddCourse={handleAddCourse}
        onAddAsset={handleAddAsset}
        onAddQuiz={handleAddQuiz}
        onOpenReceipt={handleOpenReceipt}
      />

      {/* Kotlin Source Code Inspector Modal */}
      <KotlinCodeViewer
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={selectedReceiptTx}
      />

      {/* Notifications Modal */}
      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        userUid={user.uid}
        onOpenReceipt={handleOpenReceipt}
      />

      {/* App Update Pop-up Modal */}
      {updateInfo && (
        <UpdateModal
          isOpen={isUpdateModalOpen}
          latestVersion={updateInfo.latestVersion}
          currentVersion={updateInfo.currentVersion}
          apkUrl={updateInfo.apkUrl}
          message={updateInfo.message}
          onClose={() => setIsUpdateModalOpen(false)}
        />
      )}
    </div>
  );
}
