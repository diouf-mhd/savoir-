export type SecondaryLevel = 
  | "6ème" 
  | "5ème" 
  | "4ème" 
  | "3ème" 
  | "Seconde L" 
  | "Seconde S" 
  | "Première L1" 
  | "Première L2" 
  | "Première S1" 
  | "Première S2" 
  | "Terminale L1" 
  | "Terminale L2" 
  | "Terminale S1" 
  | "Terminale S2"
  | "2nde" 
  | "1ère" 
  | "Terminale";

export type Subject = 
  | "Maths" 
  | "Physique-Chimie" 
  | "SVT" 
  | "Français" 
  | "Histoire-Géo" 
  | "Anglais" 
  | "Philo" 
  | "Informatique";

export interface Course {
  id: string;
  title: string;
  subject: Subject;
  level: SecondaryLevel;
  chapter: string;
  summary: string;
  content: string;
  createdAt: number;
}

export interface Asset {
  assetId: string;
  parentId?: string; // Course ID or Exercise ID
  name: string;
  type: "pdf" | "docx" | "image" | "audio";
  size: string;
  storagePath: string;
  downloadUrl: string;
  isCachedOffline?: boolean;
  level?: SecondaryLevel;
  subject?: Subject;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: Subject;
  level: SecondaryLevel;
  questions: QuizQuestion[];
  createdAt: number;
}

export interface QuizResultRecord {
  id: string;
  studentId: string;
  studentName: string;
  quizTitle: string;
  subject: Subject;
  level: SecondaryLevel;
  scorePercentage: number;
  score20: number;
  totalQuestions: number;
  correctAnswers: number;
  date: string;
  timestamp: number;
}

export interface StudentRecord {
  uid: string;
  displayName: string;
  email: string;
  level: SecondaryLevel;
  status: "En ligne" | "Hors-ligne";
  lastLogin: string;
  createdAt: number;
  quizResults: QuizResultRecord[];
  photoUrl?: string;
  password?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  level: SecondaryLevel;
  photoUrl?: string;
  isAdmin?: boolean;
  password?: string;
  createdAt: number;
}

export interface KotlinCodeFile {
  filename: string;
  packagePath: string;
  code: string;
  description: string;
}

export type TransactionStatus = "pending" | "approved" | "rejected";
export type PaymentFormType = "renforcement" | "domicile";
export type PaymentOperator = "wave" | "orange";

export interface PaymentTransaction {
  id: string;
  userUid: string;
  userName: string; // Nom de la personne qui effectue le paiement / Titulaire du compte
  learnerName: string; // Prénom et Nom de l'apprenant pour qui le cours est payé
  type: PaymentFormType;
  paymentType: "inscription" | "mensualite";
  selectedMonth?: string; // e.g. "Octobre", "Novembre"...
  level: SecondaryLevel;
  subjects: Subject[];
  amount: number;
  operator: PaymentOperator;
  phoneNumber: string; // Numéro de transfert vers 78 376 95 84
  status: TransactionStatus;
  createdAt: number;
  dateFormatted: string;
  tuteurName?: string;
  address?: string;
  weeklyHours?: string;
  serie?: string;
  rejectionReason?: string;
}

export interface UserNotification {
  id: string;
  userUid: string;
  title: string;
  message: string;
  type: "payment_status" | "general" | "info" | "admin_broadcast" | "class_change";
  status: "unread" | "read";
  transactionId?: string;
  createdAt: number;
  dateFormatted: string;
}

export type ClassChangeStatus = "pending" | "approved" | "rejected";

export interface ClassChangeRequest {
  id: string;
  userUid: string;
  userName: string;
  userEmail: string;
  currentLevel: SecondaryLevel;
  requestedLevel: SecondaryLevel;
  reason: string;
  status: ClassChangeStatus;
  createdAt: number;
  dateFormatted: string;
  rejectionReason?: string;
}

