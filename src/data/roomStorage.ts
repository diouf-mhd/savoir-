import { Course, Asset, Quiz, UserProfile, SecondaryLevel, StudentRecord, QuizResultRecord, PaymentTransaction, UserNotification, TransactionStatus, ClassChangeRequest, ClassChangeStatus } from "../types";
import { INITIAL_COURSES, INITIAL_ASSETS, INITIAL_QUIZZES, INITIAL_STUDENTS } from "./mockData";

const STORAGE_KEYS = {
  COURSES: "savoirplus_room_courses",
  ASSETS: "savoirplus_room_assets",
  QUIZZES: "savoirplus_room_quizzes",
  STUDENTS: "savoirplus_room_students",
  USER: "savoirplus_user_profile",
  TRANSACTIONS: "savoirplus_room_transactions",
  NOTIFICATIONS: "savoirplus_room_notifications",
  OFFLINE_MODE: "savoirplus_offline_mode",
  SYNC_STATUS: "savoirplus_sync_status",
  ADMIN_PASSWORD: "savoirplus_admin_password",
  CLASS_CHANGE_REQUESTS: "savoirplus_class_change_requests",
};

export class RoomDatabaseRepository {
  private static instance: RoomDatabaseRepository;
  private listeners: Array<() => void> = [];

  private constructor() {
    this.initDefaultData();
  }

  public static getInstance(): RoomDatabaseRepository {
    if (!RoomDatabaseRepository.instance) {
      RoomDatabaseRepository.instance = new RoomDatabaseRepository();
    }
    return RoomDatabaseRepository.instance;
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private initDefaultData() {
    if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(INITIAL_COURSES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ASSETS)) {
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(INITIAL_ASSETS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUIZZES)) {
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(INITIAL_QUIZZES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      const defaultUser: UserProfile = {
        uid: "user_massaw_01",
        displayName: "Massaw Seck",
        email: "massaw.seck@unchk.edu.sn",
        level: "3ème",
        photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        isAdmin: true,
        createdAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      const initialTxs: PaymentTransaction[] = [
        {
          id: "tx_sample_01",
          userUid: "user_massaw_01",
          userName: "Massaw Seck",
          learnerName: "Awa Ndiaye",
          type: "renforcement",
          paymentType: "mensualite",
          selectedMonth: "Novembre",
          level: "3ème",
          subjects: ["Maths", "Physique-Chimie"],
          amount: 5000,
          operator: "wave",
          phoneNumber: "78 376 95 84",
          status: "pending",
          createdAt: Date.now() - 3600000,
          dateFormatted: "Aujourd'hui, 09:15",
        },
        {
          id: "tx_sample_02",
          userUid: "user_massaw_01",
          userName: "Massaw Seck",
          learnerName: "Massaw Seck",
          type: "domicile",
          paymentType: "mensualite",
          selectedMonth: "Octobre",
          level: "3ème",
          subjects: ["Maths", "Français"],
          amount: 10000,
          operator: "orange",
          phoneNumber: "78 376 95 84",
          status: "approved",
          createdAt: Date.now() - 86400000,
          dateFormatted: "Hier, 14:30",
          tuteurName: "M. Cheikh Seck",
          address: "Dakar, Sacré Cœur 3, Villa N° 12",
          weeklyHours: "2h/semaine",
        },
      ];
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTxs));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      const initialNotifs: UserNotification[] = [
        {
          id: "notif_sample_01",
          userUid: "user_massaw_01",
          title: "Paiement en cours de vérification par l'administration",
          message: "Transfert Wave de 5 000 FCFA pour Awa Ndiaye (78 376 95 84) enregistré et en cours de vérification.",
          type: "payment_status",
          status: "unread",
          transactionId: "tx_sample_01",
          createdAt: Date.now() - 3600000,
          dateFormatted: "Aujourd'hui, 09:15",
        },
        {
          id: "notif_sample_02",
          userUid: "user_massaw_01",
          title: "Paiement Validé !",
          message: "Votre paiement de 10 000 FCFA pour le cours à domicile (Massaw Seck) a été validé avec succès par l'administration. Reçu disponible.",
          type: "payment_status",
          status: "read",
          transactionId: "tx_sample_02",
          createdAt: Date.now() - 86400000,
          dateFormatted: "Hier, 14:30",
        },
      ];
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(initialNotifs));
    }
  }

  // --- Admin Password DAO ---
  public getAdminPassword(): string {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || "Perpendiculaire @2026";
  }

  public setAdminPassword(newPassword: string): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, newPassword);
    
    // Also update student list if admin is present
    const students = this.getAllStudents();
    let updated = false;
    const newStudents = students.map((s) => {
      if (s.email.toLowerCase() === "massaw.seck@unchk.edu.sn" || s.uid === "admin_1") {
        updated = true;
        return { ...s, password: newPassword };
      }
      return s;
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(newStudents));
    }

    this.notify();
    import("./firebaseStorage").then((m) => {
      m.saveAdminPasswordToFirebase(newPassword).catch(console.error);
    });
  }

  // --- Room DAO Operations ---

  public getCoursesByLevel(level: SecondaryLevel): Course[] {
    const raw = localStorage.getItem(STORAGE_KEYS.COURSES);
    if (!raw) return [];
    try {
      const courses: Course[] = JSON.parse(raw);
      return courses
        .filter((c) => c.level === level)
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }

  public getAllCourses(): Course[] {
    const raw = localStorage.getItem(STORAGE_KEYS.COURSES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public getAssetsForParent(parentId: string): Asset[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSETS);
    if (!raw) return [];
    try {
      const assets: Asset[] = JSON.parse(raw);
      return assets.filter((a) => a.parentId === parentId);
    } catch {
      return [];
    }
  }

  public getAllAssets(): Asset[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSETS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public getQuizzesByLevel(level: SecondaryLevel): Quiz[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    if (!raw) return [];
    try {
      const quizzes: Quiz[] = JSON.parse(raw);
      return quizzes.filter((q) => q.level === level);
    } catch {
      return [];
    }
  }

  public getAllQuizzes(): Quiz[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public insertCourses(newCourses: Course[]) {
    const current = this.getAllCourses();
    const map = new Map<string, Course>();
    current.forEach((c) => map.set(c.id, c));
    newCourses.forEach((c) => map.set(c.id, c));
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(Array.from(map.values())));
    this.notify();
  }

  public updateCourse(updatedCourse: Course) {
    const current = this.getAllCourses();
    const index = current.findIndex((c) => c.id === updatedCourse.id);
    if (index >= 0) {
      current[index] = updatedCourse;
    } else {
      current.unshift(updatedCourse);
    }
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(current));
    this.notify();
  }

  public deleteCourse(courseId: string) {
    const current = this.getAllCourses();
    const filtered = current.filter((c) => c.id !== courseId);
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(filtered));
    this.notify();
    import("./firebaseStorage").then((m) => {
      m.deleteCourseFromFirebase(courseId).catch(console.error);
    });
  }

  public insertAssets(newAssets: Asset[]) {
    const current = this.getAllAssets();
    const map = new Map<string, Asset>();
    current.forEach((a) => map.set(a.assetId, a));
    newAssets.forEach((a) => map.set(a.assetId, a));
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(Array.from(map.values())));
    this.notify();
  }

  public updateAsset(updatedAsset: Asset) {
    const current = this.getAllAssets();
    const index = current.findIndex((a) => a.assetId === updatedAsset.assetId);
    if (index >= 0) {
      current[index] = updatedAsset;
    } else {
      current.unshift(updatedAsset);
    }
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(current));
    this.notify();
  }

  public deleteAsset(assetId: string) {
    const current = this.getAllAssets();
    const filtered = current.filter((a) => a.assetId !== assetId);
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(filtered));
    this.notify();
    import("./firebaseStorage").then((m) => {
      m.deleteAssetFromFirebase(assetId).catch(console.error);
    });
  }

  public insertQuiz(quiz: Quiz) {
    const current = this.getAllQuizzes();
    const map = new Map<string, Quiz>();
    current.forEach((q) => map.set(q.id, q));
    map.set(quiz.id, quiz);
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(Array.from(map.values())));
    this.notify();
  }

  public updateQuiz(updatedQuiz: Quiz) {
    const current = this.getAllQuizzes();
    const index = current.findIndex((q) => q.id === updatedQuiz.id);
    if (index >= 0) {
      current[index] = updatedQuiz;
    } else {
      current.unshift(updatedQuiz);
    }
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(current));
    this.notify();
  }

  public deleteQuiz(quizId: string) {
    const current = this.getAllQuizzes();
    const filtered = current.filter((q) => q.id !== quizId);
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(filtered));
    this.notify();
    import("./firebaseStorage").then((m) => {
      m.deleteQuizFromFirebase(quizId).catch(console.error);
    });
  }

  public clearCourses() {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify([]));
    this.notify();
  }

  public clearAssets() {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify([]));
    this.notify();
  }

  public resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(INITIAL_COURSES));
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(INITIAL_ASSETS));
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(INITIAL_QUIZZES));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    this.notify();
  }

  // --- Student Management & Quiz Scoring ---

  public getAllStudents(): StudentRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) return INITIAL_STUDENTS;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STUDENTS;
    }
  }

  public registerOrUpdateStudent(user: UserProfile) {
    if (user.isAdmin && user.password) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, user.password);
    }
    const students = this.getAllStudents();
    const existingIndex = students.findIndex((s) => s.email.toLowerCase() === user.email.toLowerCase() || s.uid === user.uid);
    
    const nowStr = `Aujourd'hui, ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    
    if (existingIndex >= 0) {
      students[existingIndex] = {
        ...students[existingIndex],
        displayName: user.displayName,
        level: user.level,
        status: "En ligne",
        lastLogin: nowStr,
        password: user.password || students[existingIndex].password,
        photoUrl: user.photoUrl || students[existingIndex].photoUrl,
      };
    } else {
      const newStudent: StudentRecord = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        level: user.level,
        status: "En ligne",
        lastLogin: nowStr,
        createdAt: Date.now(),
        quizResults: [],
        password: user.password,
        photoUrl: user.photoUrl,
      };
      students.unshift(newStudent);
    }

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    this.notify();
  }

  public addQuizResult(studentId: string, result: QuizResultRecord) {
    const students = this.getAllStudents();
    const student = students.find((s) => s.uid === studentId || s.email.toLowerCase() === result.studentName.toLowerCase());
    
    if (student) {
      student.quizResults.unshift(result);
    } else {
      // Create record if student wasn't registered yet
      const newStudent: StudentRecord = {
        uid: studentId,
        displayName: result.studentName,
        email: `${result.studentName.toLowerCase().replace(/\s+/g, ".")}@senegal.sn`,
        level: result.level,
        status: "En ligne",
        lastLogin: "Aujourd'hui",
        createdAt: Date.now(),
        quizResults: [result],
      };
      students.unshift(newStudent);
    }

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    this.notify();
  }

  // --- User Profile & Offline Sync ---

  public getUserProfile(): UserProfile | null {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public setUserProfile(user: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    this.notify();
  }

  public clearUserProfile() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    this.notify();
  }

  public updateUserProfile(updated: Partial<UserProfile>): UserProfile | null {
    const current = this.getUserProfile();
    if (!current) return null;
    const newUser = { ...current, ...updated };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    this.notify();
    return newUser;
  }

  public toggleAssetOfflineCache(assetId: string): boolean {
    const assets = this.getAllAssets();
    let isNowCached = false;
    const updated = assets.map((a) => {
      if (a.assetId === assetId) {
        isNowCached = !a.isCachedOffline;
        return { ...a, isCachedOffline: isNowCached };
      }
      return a;
    });
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(updated));
    this.notify();
    return isNowCached;
  }

  // SyncWorker emulation
  public async runSyncWorker(userLevel: SecondaryLevel): Promise<boolean> {
    // Simulate background worker network fetch from Firestore
    await new Promise((res) => setTimeout(res, 800));
    // Re-insert initial default courses for level if missing
    const defaultForLevel = INITIAL_COURSES.filter((c) => c.level === userLevel);
    if (defaultForLevel.length > 0) {
      this.insertCourses(defaultForLevel);
    }
    return true;
  }

  // --- Payment Transactions & Notifications DAO ---

  public getAllTransactions(): PaymentTransaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return [];
    try {
      const txs: PaymentTransaction[] = JSON.parse(raw);
      return txs.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }

  public getTransactionsByUser(userUid: string): PaymentTransaction[] {
    return this.getAllTransactions().filter(
      (t) => t.userUid === userUid || t.userName.toLowerCase() === userUid.toLowerCase()
    );
  }

  // Règle d'unicité : Le même nom d'apprenant ne peut pas faire 2 mensualités le même mois
  public checkDuplicateMensualite(learnerName: string, month: string): boolean {
    const nameLower = learnerName.trim().toLowerCase();
    const txs = this.getAllTransactions();
    return txs.some(
      (t) =>
        t.learnerName.trim().toLowerCase() === nameLower &&
        t.paymentType === "mensualite" &&
        t.selectedMonth === month &&
        t.status !== "rejected"
    );
  }

  public insertTransaction(tx: PaymentTransaction) {
    const current = this.getAllTransactions();
    current.unshift(tx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(current));

    // Créer automatiquement une notification "en cours de vérification" pour l'élève
    const notif: UserNotification = {
      id: "notif_" + Date.now(),
      userUid: tx.userUid,
      title: "Paiement en cours de vérification par l'administration",
      message: `Votre transfert ${tx.operator.toUpperCase()} de ${tx.amount.toLocaleString("fr-FR")} FCFA pour l'apprenant "${tx.learnerName}" est enregistré et en cours de vérification par l'administration (78 376 95 84).`,
      type: "payment_status",
      status: "unread",
      transactionId: tx.id,
      createdAt: Date.now(),
      dateFormatted: `Aujourd'hui, ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    };
    this.addNotification(notif);

    this.notify();
  }

  public updateTransactionStatus(
    txId: string,
    newStatus: TransactionStatus,
    rejectionReason?: string
  ): PaymentTransaction | null {
    const current = this.getAllTransactions();
    const index = current.findIndex((t) => t.id === txId);
    if (index === -1) return null;

    current[index] = {
      ...current[index],
      status: newStatus,
      rejectionReason: rejectionReason || current[index].rejectionReason,
    };
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(current));

    const tx = current[index];
    // Envoi de la notification selon le statut
    const isApproved = newStatus === "approved";
    const title = isApproved
      ? "✅ Paiement Validé par l'Administration !"
      : "❌ Paiement Rejeté par l'Administration";
    const message = isApproved
      ? `Félicitations ! Votre paiement de ${tx.amount.toLocaleString("fr-FR")} FCFA pour l'apprenant "${tx.learnerName}" (${tx.type === 'renforcement' ? 'Renforcement au centre' : 'Cours à domicile'}) a été validé avec succès par l'administration. Votre reçu numérique est prêt.`
      : `Le paiement de ${tx.amount.toLocaleString("fr-FR")} FCFA pour l'apprenant "${tx.learnerName}" a été rejeté${rejectionReason ? ` : ${rejectionReason}` : ''}. Veuillez vérifier votre transfert vers le 78 376 95 84.`;

    const notif: UserNotification = {
      id: "notif_" + Date.now(),
      userUid: tx.userUid,
      title,
      message,
      type: "payment_status",
      status: "unread",
      transactionId: tx.id,
      createdAt: Date.now(),
      dateFormatted: `Aujourd'hui, ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    };
    this.addNotification(notif);

    this.notify();
    return current[index];
  }

  public deleteTransaction(txId: string, userUid?: string) {
    const current = this.getAllTransactions();
    const txObj = current.find((t) => t.id === txId);
    const targetUid = userUid || txObj?.userUid;
    const filtered = current.filter((t) => t.id !== txId);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    this.notify();
    import("./firebaseStorage").then((m) => {
      m.deleteTransactionFromFirebase(txId, targetUid).catch(console.error);
    });
  }

  public resetValidatedRevenue() {
    // Supprime uniquement les transactions validées (approved) ou remet leur montant à 0 / réinitialise
    const current = this.getAllTransactions();
    const remaining = current.filter((t) => t.status !== "approved");
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(remaining));
    this.notify();
  }

  public clearAllTransactions() {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    this.notify();
  }

  public getAllNotifications(): UserNotification[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) return [];
    try {
      const notifs: UserNotification[] = JSON.parse(raw);
      return notifs.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }

  public deleteStudent(studentUid: string) {
    // Remove student record
    const students = this.getAllStudents();
    const filteredStudents = students.filter((s) => s.uid !== studentUid);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(filteredStudents));

    // Remove transactions associated with student
    const txs = this.getAllTransactions();
    const filteredTxs = txs.filter((t) => t.userUid !== studentUid);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filteredTxs));

    // Remove notifications associated with student
    const notifs = this.getAllNotifications();
    const filteredNotifs = notifs.filter((n) => n.userUid !== studentUid);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(filteredNotifs));

    this.notify();

    // Trigger Firebase Auth & Firestore cascade deletion
    import("./firebaseStorage").then((m) => {
      m.deleteUserFromFirebaseCascade(studentUid).catch(console.error);
    });
  }

  public deleteStudentQuizResult(studentUid: string, timestamp: number) {
    const students = this.getAllStudents();
    const student = students.find((s) => s.uid === studentUid);
    if (student) {
      student.quizResults = student.quizResults.filter((r) => r.timestamp !== timestamp);
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      this.notify();
    }
  }

  public getNotificationsByUser(userUid: string): UserNotification[] {
    return this.getAllNotifications().filter(
      (n) => n.userUid === userUid || n.userUid === "all"
    );
  }

  public addNotification(notif: UserNotification) {
    const current = this.getAllNotifications();
    current.unshift(notif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(current));
    this.notify();
  }

  public deleteNotification(notifId: string, userUid?: string) {
    const current = this.getAllNotifications();
    const notifObj = current.find((n) => n.id === notifId);
    const targetUid = userUid || notifObj?.userUid;
    const filtered = current.filter((n) => n.id !== notifId);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(filtered));
    this.notify();

    if (targetUid) {
      import("./firebaseStorage").then((m) => {
        m.deleteNotificationFromFirebase(notifId, targetUid).catch(console.error);
      });
    }
  }

  public clearAllNotifications() {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    this.notify();
    import("./firebaseStorage").then((m) => {
      m.clearAllNotificationsFromFirebase().catch(console.error);
    });
  }

  public sendAdminMessage(targetUid: string, title: string, message: string) {
    const notif: UserNotification = {
      id: "notif_admin_" + Date.now(),
      userUid: targetUid,
      title: title.trim() || "📢 Message de l'Administration Savoir+",
      message: message.trim(),
      type: "admin_broadcast",
      status: "unread",
      createdAt: Date.now(),
      dateFormatted: `Aujourd'hui, ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    };
    this.addNotification(notif);
  }

  public markNotificationAsRead(notifId: string) {
    const current = this.getAllNotifications();
    const index = current.findIndex((n) => n.id === notifId);
    if (index >= 0) {
      current[index].status = "read";
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(current));
      this.notify();
    }
  }

  public markAllNotificationsAsRead(userUid: string) {
    const current = this.getAllNotifications();
    let changed = false;
    current.forEach((n) => {
      if (n.userUid === userUid && n.status === "unread") {
        n.status = "read";
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(current));
      this.notify();
    }
  }

  // --- Class Change Requests DAO ---

  public getAllClassChangeRequests(): ClassChangeRequest[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASS_CHANGE_REQUESTS);
    if (!raw) return [];
    try {
      const reqs: ClassChangeRequest[] = JSON.parse(raw);
      return reqs.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }

  public getClassChangeRequestsByUser(userUid: string): ClassChangeRequest[] {
    return this.getAllClassChangeRequests().filter((r) => r.userUid === userUid);
  }

  public createClassChangeRequest(
    userUid: string,
    userName: string,
    userEmail: string,
    currentLevel: SecondaryLevel,
    requestedLevel: SecondaryLevel,
    reason: string
  ): ClassChangeRequest {
    const reqs = this.getAllClassChangeRequests();
    const now = Date.now();
    const dateFormatted = `Aujourd'hui, ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;

    const newReq: ClassChangeRequest = {
      id: "req_lvl_" + now,
      userUid,
      userName,
      userEmail,
      currentLevel,
      requestedLevel,
      reason: reason.trim(),
      status: "pending",
      createdAt: now,
      dateFormatted,
    };

    reqs.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.CLASS_CHANGE_REQUESTS, JSON.stringify(reqs));

    // Send an admin notification
    this.addNotification({
      id: "notif_lvl_admin_" + now,
      userUid: "all",
      title: "Demande de Changement de Classe",
      message: `${userName} (${currentLevel}) demande à passer en classe de ${requestedLevel}. Motif : "${reason.trim()}"`,
      type: "class_change",
      status: "unread",
      createdAt: now,
      dateFormatted,
    });

    this.notify();

    import("./firebaseStorage").then((m) => {
      m.saveClassChangeRequestToFirebase(newReq).catch(console.error);
    });

    return newReq;
  }

  public updateClassChangeRequestStatus(
    requestId: string,
    status: ClassChangeStatus,
    rejectionReason?: string
  ): ClassChangeRequest | null {
    const reqs = this.getAllClassChangeRequests();
    const index = reqs.findIndex((r) => r.id === requestId);
    if (index === -1) return null;

    reqs[index].status = status;
    if (rejectionReason) {
      reqs[index].rejectionReason = rejectionReason;
    }

    const req = reqs[index];
    localStorage.setItem(STORAGE_KEYS.CLASS_CHANGE_REQUESTS, JSON.stringify(reqs));

    const now = Date.now();
    const dateFormatted = `Aujourd'hui, ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;

    if (status === "approved") {
      // Update user profile if this is the currently logged in user
      const currentUser = this.getUserProfile();
      if (currentUser && (currentUser.uid === req.userUid || currentUser.email.toLowerCase() === req.userEmail.toLowerCase())) {
        this.setUserProfile({
          ...currentUser,
          level: req.requestedLevel,
        });
      }

      // Update student record in students list
      const students = this.getAllStudents();
      const stdIndex = students.findIndex((s) => s.uid === req.userUid || s.email.toLowerCase() === req.userEmail.toLowerCase());
      if (stdIndex >= 0) {
        students[stdIndex].level = req.requestedLevel;
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      }

      // Notify student
      this.addNotification({
        id: "notif_lvl_appr_" + now,
        userUid: req.userUid,
        title: "✅ Demande de changement de classe approuvée !",
        message: `Félicitations ! L'administration a accepté votre passage de la classe de ${req.currentLevel} à la classe de ${req.requestedLevel}. Votre espace d'apprentissage a été mis à jour.`,
        type: "class_change",
        status: "unread",
        createdAt: now,
        dateFormatted,
      });
    } else if (status === "rejected") {
      this.addNotification({
        id: "notif_lvl_rej_" + now,
        userUid: req.userUid,
        title: "❌ Demande de changement de classe refusée",
        message: `Votre demande de passage en classe de ${req.requestedLevel} a été refusée par l'administration${rejectionReason ? ` (Motif : ${rejectionReason})` : ""}. Vous restez en classe de ${req.currentLevel}.`,
        type: "class_change",
        status: "unread",
        createdAt: now,
        dateFormatted,
      });
    }

    this.notify();

    import("./firebaseStorage").then((m) => {
      m.updateClassChangeRequestStatusFirebase(requestId, status, req.userUid, req.requestedLevel).catch(console.error);
    });

    return req;
  }

}
