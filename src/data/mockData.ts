import { Course, Asset, Quiz, SecondaryLevel, Subject, StudentRecord } from "../types";

export const ALL_LEVELS: SecondaryLevel[] = [
  "6ème",
  "5ème",
  "4ème",
  "3ème",
  "Seconde L",
  "Seconde S",
  "Première L1",
  "Première L2",
  "Première S1",
  "Première S2",
  "Terminale L1",
  "Terminale L2",
  "Terminale S1",
  "Terminale S2"
];

export const ALL_SUBJECTS: Subject[] = [
  "Maths", "Physique-Chimie", "SVT", "Français", "Histoire-Géo", "Anglais", "Philo", "Informatique"
];

export function getSubjectsForLevel(level: SecondaryLevel): Subject[] {
  if (level === "6ème" || level === "5ème") {
    return ["Maths", "SVT", "Français", "Anglais", "Histoire-Géo"];
  }
  if (level === "4ème" || level === "3ème") {
    return ["Maths", "Physique-Chimie", "SVT", "Français", "Anglais", "Histoire-Géo"];
  }
  if (
    level.startsWith("Seconde") ||
    level.startsWith("Première") ||
    level === "2nde" ||
    level === "1ère"
  ) {
    // Toutes les Secondes et Premières : Math-PC-SVT-Français-Anglais-HG
    return ["Maths", "Physique-Chimie", "SVT", "Français", "Anglais", "Histoire-Géo"];
  }
  if (
    level.startsWith("Terminale") ||
    level === "Terminale"
  ) {
    // Toutes les Terminales : Math-PC-SVT-Français-Philo-HG
    return ["Maths", "Physique-Chimie", "SVT", "Français", "Philo", "Histoire-Géo"];
  }
  return ALL_SUBJECTS;
}

export const INITIAL_COURSES: Course[] = [
  // 3ème (BFEM preparation)
  {
    id: "c_math_3_01",
    title: "Théorème de Thalès et Applications",
    subject: "Maths",
    level: "3ème",
    chapter: "Chapitre 1 : Géométrie dans le plan",
    summary: "Propriétés du théorème de Thalès, réciproque et agrandissement/réduction dans les triangles.",
    content: `## 1. Énoncé du Théorème de Thalès
Soient deux droites (d) et (d') sécantes en A.
Soient B et M deux points de (d) distincts de A.
Soient C et N deux points de (d') distincts de A.
Si les droites (BC) et (MN) sont parallèles, alors :
**AM / AB = AN / AC = MN / BC**

## 2. Réciproque du Théorème
Si les points A, B, M d'une part et A, C, N d'autre part sont alignés dans le même ordre et si AM/AB = AN/AC, alors la droite (MN) est parallèle à la droite (BC).

## 3. Applications au BFEM
- Calcul de grandeurs inaccessibles (hauteur d'un bâtiment, largeur d'un fleuve).
- Démontrer le parallélisme de deux droites dans un triangle.`,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "c_svt_3_01",
    title: "La Digestion et l'Absorption Intestinale chez l'Homme",
    subject: "SVT",
    level: "3ème",
    chapter: "Chapitre 2 : Nutrition et Santé",
    summary: "Transformation mécanique et chimique des aliments, rôle des enzymes et villosités intestinales.",
    content: `## 1. La Transformation des Aliments
La digestion est la transformation des aliments complexes en nutriments simples utilisables par les cellules organisées.
- **Action mécanique** : Mastication dans la bouche, brassage stomacal, péristaltisme intestinal.
- **Action chimique** : Enzymes digestives (amylase salivaire, pepsine, lipase, protéases).

## 2. Les Produits de la Digestion
- Glucides -> Glucose
- Protéines -> Acides aminés
- Lipides -> Acides gras + Glycérol

## 3. L'Absorption Intestinale
L'intestin grêle possède de nombreuses villosités intestinales (surface d'échange de plus de 200 m²). Les nutriments traversent la paroi pour rejoindre le sang et la lymphe.`,
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: "c_pc_3_01",
    title: "Masse Volumique et Densité des Corps",
    subject: "Physique-Chimie",
    level: "3ème",
    chapter: "Chapitre 1 : Propriétés de la Matière",
    summary: "Définition de la masse volumique (ρ = m/V), unités, mesure pratique et densité par rapport à l'eau.",
    content: `## 1. La Masse Volumique
La masse volumique ρ (rho) d'un corps est le rapport entre sa masse m et son volume V :
**ρ = m / V**
Unités usuelles : kg/m³ ou g/cm³.

## 2. La Densité
Pour un solide ou un liquide, la densité d est le rapport sans unité :
**d = ρ_corps / ρ_eau** avec ρ_eau = 1 g/cm³ = 1000 kg/m³.

## 3. Exemples Pratiques au Sénégal
- Densité de l'huile d'arachide : d ≈ 0.92 (flotte sur l'eau).
- Densité du fer : d ≈ 7.87 (coule dans l'eau).`,
    createdAt: Date.now() - 86400000 * 3,
  },

  // Terminale (BAC preparation)
  {
    id: "c_philo_t_01",
    title: "La Conscience et l'Inconscient",
    subject: "Philo",
    level: "Terminale",
    chapter: "Domaine 1 : La Philosophie et l'Humain",
    summary: "Analyse de la certitude cartésienne (Cogito) et remise en cause par la psychanalyse freudienne.",
    content: `## 1. La Conscience comme fondement (Descartes)
René Descartes pose le "Cogito ergo sum" ("Je pense donc je suis"). La conscience définit la totalité de la vie psychique de l'homme.

## 2. La Révolution Freudienne de l'Inconscient
Sigmund Freud démontre que "Le Moi n'est pas maître dans sa propre maison".
Structure du psychisme :
- **Le Ça** : Réservoir des pulsions primaires.
- **Le Surmoi** : Intériorisation des normes morales et sociales.
- **Le Moi** : Médiateur conscient de la réalité.

## 3. Perspectives Critiques (Sartre & Alain)
Pour Jean-Paul Sartre, l'inconscient peut devenir le refuge de la "mauvaise foi" pour fuir sa responsabilité morale.`,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "c_math_t_01",
    title: "Étude des Fonctions Logarithme Népérien (ln)",
    subject: "Maths",
    level: "Terminale",
    chapter: "Chapitre 3 : Analyse",
    summary: "Définition, propriétés algebriques, limites usuelles et dérivée de la fonction ln(x).",
    content: `## 1. Définition
La fonction logarithme népérien, notée **ln**, est la primitive de x ↦ 1/x sur ]0, +∞[ qui s'annule en 1 (ln(1) = 0).

## 2. Propriétés Algébriques
Pour tous a, b > 0 :
- ln(a × b) = ln(a) + ln(b)
- ln(a / b) = ln(a) - ln(b)
- ln(aⁿ) = n × ln(a)
- ln(e) = 1 (e ≈ 2.718)

## 3. Dérivation et Limites
- (ln(x))' = 1/x pour x > 0.
- lim(x→+∞) ln(x) = +∞
- lim(x→0⁺) ln(x) = -∞
- Croissances comparées : lim(x→+∞) (ln x / x) = 0.`,
    createdAt: Date.now() - 86400000 * 1,
  },

  // 2nde
  {
    id: "c_info_2_01",
    title: "Introduction à la Logique Informatique et Algorithmique",
    subject: "Informatique",
    level: "2nde",
    chapter: "Module 1 : Bases de la programmation",
    summary: "Variables, structures conditionnelles (Si...Alors) et boucles d'itération.",
    content: `## 1. Qu'est-ce qu'un Algorithme ?
Un algorithme est une suite d'instructions finie et non ambiguë permettant de résoudre un problème donné.

## 2. Les Variables
Une variable possède : Un nom, un type (Entier, Réel, Texte, Boolean) et une valeur.

## 3. Structures de Contrôle
- **Conditionnelle** : Si (note >= 10) Alors "Admis" Sinon "Ajourné".
- **Boucle** : Pour i de 1 à 10 Faire Afficher(i).`,
    createdAt: Date.now() - 86400000 * 6,
  },

  // 6ème
  {
    id: "c_fr_6_01",
    title: "Les Grammaires et Types de Phrases en Français",
    subject: "Français",
    level: "6ème",
    chapter: "Grammaire Fondamentale",
    summary: "Phrases déclarative, interrogative, impérative et exclamative.",
    content: `## Les 4 Types de Phrases
1. **Phrase Déclarative** : Donne une information. Se termine par un point. (*Ex: L'élève révise sa leçon.*)
2. **Phrase Interrogative** : Pose une question. (*Ex: As-tu fini tes devoirs ?*)
3. **Phrase Impérative** : Donne un ordre ou un conseil. (*Ex: Écoute attentivement le maître !*)
4. **Phrase Exclamative** : Exprime une émotion forte. (*Ex: Quelle belle réussite !*)`,
    createdAt: Date.now() - 86400000 * 7,
  }
];

export const INITIAL_ASSETS: Asset[] = [
  // 6ème
  {
    assetId: "a_6_01",
    name: "Exercices de Grammaire & Types de Phrases (PDF)",
    type: "pdf",
    size: "1.1 MB",
    storagePath: "6eme/francais_grammaire_exercices.pdf",
    downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    isCachedOffline: true,
    level: "6ème",
    subject: "Français",
  },
  {
    assetId: "a_6_02",
    name: "Fiche d'Évaluation - Calcul Mental et Fractions (PDF)",
    type: "pdf",
    size: "850 KB",
    storagePath: "6eme/maths_fractions_eval.pdf",
    downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    isCachedOffline: true,
    level: "6ème",
    subject: "Maths",
  },

  // 5ème
  {
    assetId: "a_5_01",
    name: "Devoir de SVT - Les Écosystèmes et la Biodiversité (PDF)",
    type: "pdf",
    size: "1.2 MB",
    storagePath: "5eme/svt_ecosystemes_devoir.pdf",
    downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    isCachedOffline: true,
    level: "5ème",
    subject: "SVT",
  },
  {
    assetId: "a_5_02",
    name: "Exercices d'Algèbre et Équations Simples (PDF)",
    type: "pdf",
    size: "950 KB",
    storagePath: "5eme/maths_equations.pdf",
    downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    isCachedOffline: true,
    level: "5ème",
    subject: "Maths",
  },

  // 4ème
  {
    assetId: "a_4_01",
    name: "Sujet de Composition - Théorème de Pythagore & Triangles (PDF)",
    type: "pdf",
    size: "1.3 MB",
    storagePath: "4eme/maths_pythagore_comp.pdf",
    downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    isCachedOffline: true,
    level: "4ème",
    subject: "Maths",
  },
  {
    assetId: "a_4_02",
    name: "Fiche d'Exercices Physique - Les Forces et la Pression (PDF)",
    type: "pdf",
    size: "1.0 MB",
    storagePath: "4eme/pc_forces_pressions.pdf",
    downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    isCachedOffline: true,
    level: "4ème",
    subject: "Physique-Chimie",
  },

  // 3ème (BFEM)
  {
    assetId: "a_01",
    parentId: "c_math_3_01",
    name: "Sujet BFEM Maths 2024 - Session Normale (PDF)",
    type: "pdf",
    size: "1.4 MB",
    storagePath: "bfem/maths_2024.pdf",
    downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    isCachedOffline: true,
    level: "3ème",
    subject: "Maths",
  },
  {
    assetId: "a_02",
    parentId: "c_svt_3_01",
    name: "Schéma annoté des Villosités Intestinales (Image HD)",
    type: "image",
    size: "820 KB",
    storagePath: "svt/villosites_schema.png",
    downloadUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800",
    isCachedOffline: true,
    level: "3ème",
    subject: "SVT",
  },
  {
    assetId: "a_04",
    parentId: "c_pc_3_01",
    name: "Fiche Travaux Pratiques - Mesure de Masse Volumique",
    type: "pdf",
    size: "980 KB",
    storagePath: "pc/tp_masse_volumique.pdf",
    downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    isCachedOffline: true,
    level: "3ème",
    subject: "Physique-Chimie",
  },

  // 2nde
  {
    assetId: "a_2_01",
    parentId: "c_info_2_01",
    name: "TP Informatique - Algorithmique et variables (PDF)",
    type: "pdf",
    size: "1.1 MB",
    storagePath: "2nde/info_tp_algo.pdf",
    downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    isCachedOffline: true,
    level: "2nde",
    subject: "Informatique",
  },

  // 1ère
  {
    assetId: "a_1_01",
    name: "Fiche Méthodologique - Commentaire de Texte & Dissert (PDF)",
    type: "pdf",
    size: "1.2 MB",
    storagePath: "1ere/francais_methode.pdf",
    downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    isCachedOffline: true,
    level: "1ère",
    subject: "Français",
  },

  // Terminale (BAC)
  {
    assetId: "a_03",
    parentId: "c_philo_t_01",
    name: "Fiche de Synthèse - Citations Philosophiques BAC (DOCX)",
    type: "docx",
    size: "450 KB",
    storagePath: "bac/citations_philo.docx",
    downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    isCachedOffline: false,
    level: "Terminale",
    subject: "Philo",
  },
  {
    assetId: "a_t_02",
    parentId: "c_math_t_01",
    name: "Sujet BAC Blanc Maths - Analyse & Logarithmes (PDF)",
    type: "pdf",
    size: "1.6 MB",
    storagePath: "bac/maths_logarithmes.pdf",
    downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    isCachedOffline: true,
    level: "Terminale",
    subject: "Maths",
  }
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: "q_math_3_01",
    title: "Quiz Brevet BFEM : Théorème de Thalès",
    subject: "Maths",
    level: "3ème",
    createdAt: Date.now() - 86400000 * 2,
    questions: [
      {
        id: "q1",
        question: "Dans un triangle ABC avec M∈[AB] et N∈[AC], si (MN) // (BC), quelle égalité est exacte ?",
        options: [
          "AM / AB = AN / AC = MN / BC",
          "AM / AN = AB / AC = BC / MN",
          "AB / AM = AC / AN = BC / MN",
          "AM × AB = AN × AC"
        ],
        correctIndex: 0,
        explanation: "C'est l'énoncé direct du théorème de Thalès : les rapports des longueurs des côtés correspondants sont égaux."
      },
      {
        id: "q2",
        question: "Si AM = 3 cm, AB = 9 cm et AN = 4 cm, quelle est la longueur de AC ?",
        options: [
          "10 cm",
          "12 cm",
          "15 cm",
          "8 cm"
        ],
        correctIndex: 1,
        explanation: "Selon Thalès : AM/AB = AN/AC => 3/9 = 4/AC => 1/3 = 4/AC => AC = 4 × 3 = 12 cm."
      },
      {
        id: "q3",
        question: "La réciproque du théorème de Thalès sert principalement à :",
        options: [
          "Calculer une aire",
          "Démontrer que deux droites sont parallèles",
          "Trouver un angle droit",
          "Calculer la moyenne de deux longueurs"
        ],
        correctIndex: 1,
        explanation: "La réciproque permet de prouver que deux droites sont parallèles si l'égalité des rapports de grandeurs est vérifiée."
      }
    ]
  },
  {
    id: "q_svt_3_01",
    title: "Évaluation SVT : La Digestion Humaine",
    subject: "SVT",
    level: "3ème",
    createdAt: Date.now() - 86400000 * 3,
    questions: [
      {
        id: "q1_svt",
        question: "Quel est le produit final simplifié de la digestion des protéines ?",
        options: [
          "Le Glucose",
          "Les Acides Aminés",
          "Les Acides Gras",
          "L'Amidon"
        ],
        correctIndex: 1,
        explanation: "Les protéines (chaînes de polypeptides) sont découpées par les protéases jusqu'à donner des acides aminés simples."
      },
      {
        id: "q2_svt",
        question: "Où se déroule la majeure partie de l'absorption des nutriments ?",
        options: [
          "Dans la bouche",
          "Dans l'estomac",
          "Dans l'intestin grêle",
          "Dans le gros intestin"
        ],
        correctIndex: 2,
        explanation: "L'intestin grêle possède des millions de villosités intestinales très vascularisées assurant le passage des nutriments vers le sang."
      }
    ]
  },
  {
    id: "q_philo_t_01",
    title: "Quiz BAC Philo : La Conscience et l'Inconscient",
    subject: "Philo",
    level: "Terminale",
    createdAt: Date.now() - 86400000 * 1,
    questions: [
      {
        id: "q1_philo",
        question: "Qui a écrit la formule célèbre 'Cogito, ergo sum' ?",
        options: [
          "Sigmund Freud",
          "Jean-Paul Sartre",
          "René Descartes",
          "Spinoza"
        ],
        correctIndex: 2,
        explanation: "Descartes fonde dans 'Discours de la méthode' la certitude de la conscience par l'expérience du doute méthodique."
      },
      {
        id: "q2_philo",
        question: "Dans la seconde topique freudienne, quelle instance représente les règles morales intériorisées ?",
        options: [
          "Le Ça",
          "Le Surmoi",
          "Le Moi",
          "L'Inconscient collectif"
        ],
        correctIndex: 1,
        explanation: "Le Surmoi est formé par l'assimilation des règles culturelles, familiales et morales imposées à l'individu."
      }
    ]
  }
];

export const CONSEIL_DU_JOUR = [
  "« N'apprends pas seulement pour réussir tes examens, apprends pour maîtriser ton avenir ! » - Massaw Seck",
  "Organisation BFEM / BAC : Fais des fiches de révision courtes après chaque cours et refais 2 exercices types sans regarder le corrigé.",
  "La régularité bat le talent : 30 minutes de révision quotidienne valent mieux que 5 heures la veille d'un contrôle !",
  "En mathématiques, refaire les figures géométriques à main levée aide à mieux visualiser les théorèmes de Thalès et Pythagore."
];

export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    uid: "std_01",
    displayName: "Awa Diop",
    email: "awa.diop@senegal.sn",
    level: "3ème",
    status: "En ligne",
    lastLogin: "Aujourd'hui, 19:42",
    createdAt: Date.now() - 86400000 * 12,
    quizResults: [
      {
        id: "r1",
        studentId: "std_01",
        studentName: "Awa Diop",
        quizTitle: "Quiz Brevet BFEM : Théorème de Thalès",
        subject: "Maths",
        level: "3ème",
        scorePercentage: 85,
        score20: 17,
        totalQuestions: 3,
        correctAnswers: 3,
        date: "04/08/2026",
        timestamp: Date.now() - 3600000 * 2,
      },
      {
        id: "r2",
        studentId: "std_01",
        studentName: "Awa Diop",
        quizTitle: "Évaluation SVT : La Digestion Humaine",
        subject: "SVT",
        level: "3ème",
        scorePercentage: 90,
        score20: 18,
        totalQuestions: 2,
        correctAnswers: 2,
        date: "03/08/2026",
        timestamp: Date.now() - 86400000,
      },
      {
        id: "r3",
        studentId: "std_01",
        studentName: "Awa Diop",
        quizTitle: "Contrôle Physique-Chimie : Masse Volumique",
        subject: "Physique-Chimie",
        level: "3ème",
        scorePercentage: 75,
        score20: 15,
        totalQuestions: 4,
        correctAnswers: 3,
        date: "01/08/2026",
        timestamp: Date.now() - 86400000 * 3,
      }
    ]
  },
  {
    uid: "std_02",
    displayName: "Mamadou Fall",
    email: "mamadou.fall@senegal.sn",
    level: "Terminale",
    status: "En ligne",
    lastLogin: "Aujourd'hui, 18:15",
    createdAt: Date.now() - 86400000 * 20,
    quizResults: [
      {
        id: "r4",
        studentId: "std_02",
        studentName: "Mamadou Fall",
        quizTitle: "Quiz BAC Philo : La Conscience et l'Inconscient",
        subject: "Philo",
        level: "Terminale",
        scorePercentage: 80,
        score20: 16,
        totalQuestions: 2,
        correctAnswers: 2,
        date: "04/08/2026",
        timestamp: Date.now() - 3600000 * 4,
      },
      {
        id: "r5",
        studentId: "std_02",
        studentName: "Mamadou Fall",
        quizTitle: "Évaluation Maths : Fonctions Logarithme ln",
        subject: "Maths",
        level: "Terminale",
        scorePercentage: 95,
        score20: 19,
        totalQuestions: 5,
        correctAnswers: 5,
        date: "02/08/2026",
        timestamp: Date.now() - 86400000 * 2,
      }
    ]
  },
  {
    uid: "std_03",
    displayName: "Fatou Ndiaye",
    email: "fatou.ndiaye@senegal.sn",
    level: "2nde",
    status: "Hors-ligne",
    lastLogin: "Hier, 14:20",
    createdAt: Date.now() - 86400000 * 15,
    quizResults: [
      {
        id: "r6",
        studentId: "std_03",
        studentName: "Fatou Ndiaye",
        quizTitle: "QCM Algorithmique & Logique",
        subject: "Informatique",
        level: "2nde",
        scorePercentage: 85,
        score20: 17,
        totalQuestions: 4,
        correctAnswers: 3,
        date: "03/08/2026",
        timestamp: Date.now() - 86400000,
      },
      {
        id: "r7",
        studentId: "std_03",
        studentName: "Fatou Ndiaye",
        quizTitle: "Grammaire & Analyse de Texte",
        subject: "Français",
        level: "2nde",
        scorePercentage: 70,
        score20: 14,
        totalQuestions: 5,
        correctAnswers: 3,
        date: "30/07/2026",
        timestamp: Date.now() - 86400000 * 5,
      }
    ]
  },
  {
    uid: "std_04",
    displayName: "Ibrahima Sow",
    email: "ibrahima.sow@senegal.sn",
    level: "1ère",
    status: "Hors-ligne",
    lastLogin: "03/08/2026 à 11:30",
    createdAt: Date.now() - 86400000 * 10,
    quizResults: [
      {
        id: "r8",
        studentId: "std_04",
        studentName: "Ibrahima Sow",
        quizTitle: "Quiz Histoire-Géo : Décolonisation en Afrique",
        subject: "Histoire-Géo",
        level: "1ère",
        scorePercentage: 65,
        score20: 13,
        totalQuestions: 4,
        correctAnswers: 2,
        date: "03/08/2026",
        timestamp: Date.now() - 86400000,
      }
    ]
  },
  {
    uid: "std_05",
    displayName: "Ousmane Cissé",
    email: "ousmane.cisse@senegal.sn",
    level: "6ème",
    status: "En ligne",
    lastLogin: "Aujourd'hui, 19:05",
    createdAt: Date.now() - 86400000 * 8,
    quizResults: [
      {
        id: "r9",
        studentId: "std_05",
        studentName: "Ousmane Cissé",
        quizTitle: "Les 4 Types de Phrases en Français",
        subject: "Français",
        level: "6ème",
        scorePercentage: 90,
        score20: 18,
        totalQuestions: 4,
        correctAnswers: 4,
        date: "04/08/2026",
        timestamp: Date.now() - 3600000,
      }
    ]
  }
];
