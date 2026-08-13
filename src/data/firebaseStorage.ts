import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  collectionGroup,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile, updatePassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { db, auth, googleProvider, handleFirestoreError, OperationType } from "../lib/firebase";
import { RoomDatabaseRepository } from "./roomStorage";
import {
  Course,
  Asset,
  Quiz,
  UserProfile,
  PaymentTransaction,
  UserNotification,
  SecondaryLevel,
  ClassChangeRequest,
  ClassChangeStatus,
} from "../types";

// Helper for strict 3-second network timeout on Firestore requests
function withTimeout<T>(promise: Promise<T>, timeoutMs = 3000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Firestore timeout (${timeoutMs}ms)`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Firebase Firestore DAO Services

export async function loginWithGoogleFirebase(): Promise<UserProfile | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (!user) return null;

    const userUid = user.uid;
    const cleanEmail = (user.email || "").toLowerCase();
    const isAdmin = cleanEmail === "massaw.seck@unchk.edu.sn";

    const roomRepo = RoomDatabaseRepository.getInstance();
    
    // Immediate local profile resolution for instant UI redirect
    const existingStudents = roomRepo.getAllStudents();
    const matched = existingStudents.find((s) => s.email.toLowerCase() === cleanEmail || s.uid === userUid);
    const localUser = roomRepo.getUserProfile();

    let profile: UserProfile = (localUser && localUser.uid === userUid) ? localUser : {
      uid: userUid,
      displayName: user.displayName || matched?.displayName || "Élève Savoir+",
      email: cleanEmail,
      level: matched?.level || "3ème",
      photoUrl: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
      isAdmin,
      createdAt: Date.now(),
    };

    // Save profile locally in Room / LocalStorage immediately
    roomRepo.setUserProfile(profile);
    if (!profile.isAdmin) {
      roomRepo.registerOrUpdateStudent(profile);
    }

    // Trigger Firestore sync in background with 3s timeout
    (async () => {
      try {
        const userDocRef = doc(db, "users", userUid);
        const docSnap = await withTimeout(getDoc(userDocRef), 3000);
        if (docSnap.exists()) {
          const remoteProfile = docSnap.data() as UserProfile;
          roomRepo.setUserProfile(remoteProfile);
          if (!remoteProfile.isAdmin) {
            roomRepo.registerOrUpdateStudent(remoteProfile);
          }
        } else {
          setDoc(userDocRef, profile, { merge: true }).catch(() => {});
        }
      } catch (firestoreErr) {
        console.warn("Background Firestore sync skipped or timed out (>3s):", firestoreErr);
      }
    })();

    return profile;
  } catch (err) {
    console.error("Google Sign-in error:", err);
    throw err;
  }
}

export async function registerWithEmailFirebase(email: string, password: string, displayName: string, level: SecondaryLevel): Promise<UserProfile | null> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    if (!user) return null;

    await updateProfile(user, { displayName }).catch(() => {});

    const userUid = user.uid;
    const cleanEmail = (user.email || email).toLowerCase();
    const isAdmin = cleanEmail === "massaw.seck@unchk.edu.sn";

    const profile: UserProfile = {
      uid: userUid,
      displayName,
      email: cleanEmail,
      level,
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
      isAdmin,
      createdAt: Date.now(),
    };

    // Save locally immediately
    const roomRepo = RoomDatabaseRepository.getInstance();
    roomRepo.setUserProfile(profile);
    if (!isAdmin) {
      roomRepo.registerOrUpdateStudent(profile);
    }

    // Defer Firestore document write in case offline
    setDoc(doc(db, "users", userUid), profile).catch((err) => {
      console.warn("Firestore document write deferred (offline):", err);
    });

    return profile;
  } catch (err) {
    console.warn("Email Registration notice:", err);
    throw err;
  }
}

export async function loginWithEmailFirebase(email: string, password: string): Promise<UserProfile | null> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    if (!user) return null;

    const roomRepo = RoomDatabaseRepository.getInstance();
    const userUid = user.uid;
    const cleanEmail = (user.email || email).toLowerCase();
    const isAdmin = cleanEmail === "massaw.seck@unchk.edu.sn";

    // 1. CHARGEMENT OPTIMISTE INSTANTANÉ:
    // Resolve immediately with local storage or cached student profile
    const localUser = roomRepo.getUserProfile();
    const existingStudents = roomRepo.getAllStudents();
    const matched = existingStudents.find(
      (s) => s.email.toLowerCase() === cleanEmail || s.uid === userUid
    );

    let profile: UserProfile;
    if (localUser && (localUser.uid === userUid || localUser.email.toLowerCase() === cleanEmail)) {
      profile = localUser;
    } else {
      profile = {
        uid: userUid,
        displayName: user.displayName || matched?.displayName || "Élève Savoir+",
        email: cleanEmail,
        level: matched?.level || "3ème",
        photoUrl: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
        isAdmin,
        createdAt: Date.now(),
      };
    }

    // Save profile locally in Room / LocalStorage immediately
    roomRepo.setUserProfile(profile);
    if (!profile.isAdmin) {
      roomRepo.registerOrUpdateStudent(profile);
    }

    // 2. CHARGEMENT FIRESTORE EN ARRIÈRE-PLAN (Background 3s max timeout)
    (async () => {
      try {
        const userDocRef = doc(db, "users", userUid);
        const docSnap = await withTimeout(getDoc(userDocRef), 3000);
        if (docSnap.exists()) {
          const remoteProfile = docSnap.data() as UserProfile;
          roomRepo.setUserProfile(remoteProfile);
          if (!remoteProfile.isAdmin) {
            roomRepo.registerOrUpdateStudent(remoteProfile);
          }
        } else {
          setDoc(userDocRef, profile, { merge: true }).catch(() => {});
        }
      } catch (firestoreErr) {
        console.warn("Background Firestore sync skipped or timed out (>3s):", firestoreErr);
      }
    })();

    // Return profile instantly so AuthModal triggers onLogin() without delay!
    return profile;
  } catch (err) {
    console.warn("Email Login notice:", err);
    throw err;
  }
}

export async function syncUserProfileToFirebase(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, "users", profile.uid), profile, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveTransactionToFirebase(tx: PaymentTransaction): Promise<void> {
  const path = `users/${tx.userUid}/receipts/${tx.id}`;
  try {
    await setDoc(doc(db, "users", tx.userUid, "receipts", tx.id), tx);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveNotificationToFirebase(notif: UserNotification): Promise<void> {
  const path = `users/${notif.userUid}/notifications/${notif.id}`;
  try {
    await setDoc(doc(db, "users", notif.userUid, "notifications", notif.id), notif);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveCourseToFirebase(course: Course): Promise<void> {
  const path = `courses/${course.id}`;
  try {
    await setDoc(doc(db, "courses", course.id), course);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveQuizToFirebase(quiz: Quiz): Promise<void> {
  const path = `quizzes/${quiz.id}`;
  try {
    await setDoc(doc(db, "quizzes", quiz.id), quiz);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAssetToFirebase(asset: Asset): Promise<void> {
  const path = `assets/${asset.assetId}`;
  try {
    await setDoc(doc(db, "assets", asset.assetId), asset);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToUserTransactions(
  userUid: string,
  onData: (txs: PaymentTransaction[]) => void
): () => void {
  const path = `users/${userUid}/receipts`;
  try {
    const q = query(collection(db, "users", userUid, "receipts"));
    return onSnapshot(
      q,
      (snapshot) => {
        const txs: PaymentTransaction[] = [];
        snapshot.forEach((doc) => txs.push(doc.data() as PaymentTransaction));
        onData(txs);
      },
      (err) => {
        console.warn(`Firestore subscription error (${path}):`, err);
      }
    );
  } catch (err) {
    console.warn("Firestore subscription unavailable, falling back to local storage", err);
    return () => {};
  }
}

export function subscribeToAllTransactions(
  onData: (txs: PaymentTransaction[]) => void
): () => void {
  const path = `receipts (collectionGroup)`;
  try {
    const q = query(collectionGroup(db, "receipts"));
    return onSnapshot(
      q,
      (snapshot) => {
        const txs: PaymentTransaction[] = [];
        snapshot.forEach((doc) => txs.push(doc.data() as PaymentTransaction));
        onData(txs);
      },
      (err) => {
        console.warn(`Firestore subscription error (${path}):`, err);
      }
    );
  } catch (err) {
    console.warn("Firestore subscription unavailable", err);
    return () => {};
  }
}

export function subscribeToUserNotifications(
  userUid: string,
  onData: (notifs: UserNotification[]) => void
): () => void {
  const path = `users/${userUid}/notifications`;
  try {
    const q = query(collection(db, "users", userUid, "notifications"));
    return onSnapshot(
      q,
      (snapshot) => {
        const notifs: UserNotification[] = [];
        snapshot.forEach((doc) => notifs.push(doc.data() as UserNotification));
        onData(notifs);
      },
      (err) => {
        console.warn(`Firestore subscription error (${path}):`, err);
      }
    );
  } catch (err) {
    console.warn("Firestore notification subscription unavailable", err);
    return () => {};
  }
}

export async function deleteNotificationFromFirebase(notifId: string, userUid?: string): Promise<void> {
  try {
    if (userUid) {
      const userNotifRef = doc(db, "users", userUid, "notifications", notifId);
      await deleteDoc(userNotifRef);
    }
    const topNotifRef = doc(db, "notifications", notifId);
    await deleteDoc(topNotifRef).catch(() => {});
  } catch (err) {
    console.warn(`Error deleting notification ${notifId} from Firebase:`, err);
  }
}

export async function getUserProfileFromFirebase(uid: string): Promise<UserProfile | null> {
  const roomRepo = RoomDatabaseRepository.getInstance();
  try {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await withTimeout(getDoc(userDocRef), 3000);
    if (docSnap.exists()) {
      const profile = docSnap.data() as UserProfile;
      roomRepo.setUserProfile(profile);
      if (!profile.isAdmin) {
        roomRepo.registerOrUpdateStudent(profile);
      }
      return profile;
    }
  } catch (err) {
    console.warn("Error getting user profile from Firebase (timeout 3s / offline mode):", err);
  }

  // Fallback to local profile or construct from auth.currentUser
  const localUser = roomRepo.getUserProfile();
  if (localUser && localUser.uid === uid) {
    return localUser;
  }

  const currentAuthUser = auth.currentUser;
  if (currentAuthUser && currentAuthUser.uid === uid) {
    const cleanEmail = (currentAuthUser.email || "").toLowerCase();
    const isAdmin = cleanEmail === "massaw.seck@unchk.edu.sn";
    const profile: UserProfile = {
      uid,
      displayName: currentAuthUser.displayName || "Élève Savoir+",
      email: cleanEmail,
      level: "3ème",
      photoUrl: currentAuthUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
      isAdmin,
      createdAt: Date.now(),
    };
    roomRepo.setUserProfile(profile);
    if (!isAdmin) {
      roomRepo.registerOrUpdateStudent(profile);
    }
    return profile;
  }

  return localUser;
}

export async function updateUserPasswordFirebase(newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    await updatePassword(user, newPassword);
  }
}

export async function signOutFirebase(): Promise<void> {
  try {
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch (err) {
    console.warn("Sign out firebase error:", err);
  }
}

export async function sendPasswordResetEmailFirebase(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function saveAdminPasswordToFirebase(password: string): Promise<void> {
  try {
    await setDoc(doc(db, "settings", "admin"), { adminPassword: password, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.warn("Error saving admin password to Firestore:", err);
  }
}

export async function getAdminPasswordFromFirebase(): Promise<string | null> {
  try {
    const docSnap = await getDoc(doc(db, "settings", "admin"));
    if (docSnap.exists() && docSnap.data()?.adminPassword) {
      return docSnap.data().adminPassword as string;
    }
    return null;
  } catch (err) {
    console.warn("Error loading admin password from Firestore:", err);
    return null;
  }
}

// CASCADE & ELEMENT DELETION FUNCTIONS IN FIRESTORE
export async function deleteCourseFromFirebase(courseId: string): Promise<void> {
  const path = `courses/${courseId}`;
  try {
    await deleteDoc(doc(db, "courses", courseId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function deleteAssetFromFirebase(assetId: string): Promise<void> {
  const path = `assets/${assetId}`;
  try {
    await deleteDoc(doc(db, "assets", assetId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function deleteQuizFromFirebase(quizId: string): Promise<void> {
  const path = `quizzes/${quizId}`;
  try {
    await deleteDoc(doc(db, "quizzes", quizId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function deleteTransactionFromFirebase(txId: string, userUid?: string): Promise<void> {
  try {
    if (userUid) {
      await deleteDoc(doc(db, "users", userUid, "receipts", txId)).catch(() => {});
    }
    await deleteDoc(doc(db, "transactions", txId)).catch(() => {});
  } catch (err) {
    console.warn(`Error deleting transaction ${txId} from Firebase:`, err);
  }
}

export async function deleteUserFromFirebaseCascade(uid: string): Promise<void> {
  try {
    // 1. Delete main document users/{uid} in Firestore
    await deleteDoc(doc(db, "users", uid)).catch(() => {});

    // 2. Clean up user subcollection receipts and top-level transactions
    const receiptsSnap = await getDocs(collection(db, "users", uid, "receipts")).catch(() => null);
    if (receiptsSnap) {
      for (const d of receiptsSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
    }

    const topTxQ = query(collection(db, "transactions"), where("userUid", "==", uid));
    const topTxSnap = await getDocs(topTxQ).catch(() => null);
    if (topTxSnap) {
      for (const d of topTxSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
    }

    // 3. Clean up user notifications subcollection and top-level notifications
    const notifsSnap = await getDocs(collection(db, "users", uid, "notifications")).catch(() => null);
    if (notifsSnap) {
      for (const d of notifsSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
    }

    const topNotifQ = query(collection(db, "notifications"), where("userUid", "==", uid));
    const topNotifSnap = await getDocs(topNotifQ).catch(() => null);
    if (topNotifSnap) {
      for (const d of topNotifSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
    }

    // 4. Delete user from Firebase Auth if current user matches uid
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === uid) {
      await currentUser.delete().catch((e) => console.warn("Firebase Auth user.delete() notice:", e));
    }
  } catch (err) {
    console.warn(`Error cascading user deletion for ${uid}:`, err);
  }
}

export async function saveClassChangeRequestToFirebase(req: ClassChangeRequest): Promise<void> {
  try {
    const reqRef = doc(db, "class_change_requests", req.id);
    await setDoc(reqRef, req, { merge: true });
  } catch (err) {
    console.warn("Error saving class change request to Firebase:", err);
  }
}

export async function updateClassChangeRequestStatusFirebase(
  requestId: string,
  status: ClassChangeStatus,
  userUid: string,
  newLevel?: SecondaryLevel
): Promise<void> {
  try {
    const reqRef = doc(db, "class_change_requests", requestId);
    await setDoc(reqRef, { status }, { merge: true });

    if (status === "approved" && newLevel && userUid) {
      const userRef = doc(db, "users", userUid);
      await setDoc(userRef, { level: newLevel }, { merge: true });
    }
  } catch (err) {
    console.warn("Error updating class change request status in Firebase:", err);
  }
}

export async function clearAllNotificationsFromFirebase(): Promise<void> {
  try {
    const topNotifsSnap = await getDocs(collection(db, "notifications")).catch(() => null);
    if (topNotifsSnap) {
      for (const d of topNotifsSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("Error clearing all top-level notifications from Firebase:", err);
  }
}

export interface AppConfigData {
  latest_version: string;
  apk_url: string;
  message?: string;
  updatedAt?: number;
}

export async function getAppConfigFromFirebase(): Promise<AppConfigData | null> {
  try {
    const configDocRef = doc(db, "system", "app_config");
    const docSnap = await withTimeout(getDoc(configDocRef), 3000);
    if (docSnap.exists()) {
      return docSnap.data() as AppConfigData;
    }
  } catch (err) {
    console.warn("Error getting system app_config from Firebase:", err);
  }
  return null;
}

export async function saveAppConfigToFirebase(config: AppConfigData): Promise<void> {
  try {
    const configDocRef = doc(db, "system", "app_config");
    await setDoc(configDocRef, { ...config, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.warn("Error saving system app_config to Firebase:", err);
  }
}

