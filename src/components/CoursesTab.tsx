import React, { useState } from "react";
import { Course, Asset, Subject, SecondaryLevel } from "../types";
import { ALL_LEVELS, getSubjectsForLevel } from "../data/mockData";
import { DocumentViewerModal } from "./DocumentViewerModal";
import { EditCourseModal } from "./EditCourseModal";
import { RoomDatabaseRepository } from "../data/roomStorage";
import { 
  BookOpen, 
  Search, 
  Filter, 
  FileText, 
  Download, 
  CheckCircle, 
  Sparkles, 
  X,
  ExternalLink,
  ChevronRight,
  Eye,
  Play,
  Edit3,
  Trash2
} from "lucide-react";

interface CoursesTabProps {
  userLevel: SecondaryLevel;
  courses: Course[];
  assets: Asset[];
  selectedCourse: Course | null;
  onSelectCourse: (course: Course | null) => void;
  onToggleCacheAsset: (assetId: string) => void;
  onStartQuizForSubject?: (subject: Subject) => void;
  isAdmin?: boolean;
}

export const CoursesTab: React.FC<CoursesTabProps> = ({
  userLevel,
  courses,
  assets,
  selectedCourse,
  onSelectCourse,
  onToggleCacheAsset,
  onStartQuizForSubject,
  isAdmin,
}) => {
  const roomRepo = RoomDatabaseRepository.getInstance();

  const [adminLevel, setAdminLevel] = useState<SecondaryLevel>(userLevel);
  const activeLevel = isAdmin ? adminLevel : userLevel;

  const availableSubjects = getSubjectsForLevel(activeLevel);
  const [selectedSubject, setSelectedSubject] = useState<Subject | "Tous">("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewerAsset, setViewerAsset] = useState<Asset | null>(null);
  const [viewerVideoUrl, setViewerVideoUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>("");
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const handleDeleteCourse = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    roomRepo.deleteCourse(course.id);
    if (selectedCourse?.id === course.id) {
      onSelectCourse(null);
    }
  };

  const handleOpenEditCourse = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    setEditingCourse(course);
  };

  const openAssetViewer = (ast: Asset) => {
    setViewerAsset(ast);
    setViewerVideoUrl(null);
    setViewerTitle(ast.name);
    setIsViewerOpen(true);
  };

  const openVideoViewer = (courseTitle: string) => {
    setViewerAsset(null);
    setViewerVideoUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
    setViewerTitle(`Capsule Vidéo Explicative : ${courseTitle}`);
    setIsViewerOpen(true);
  };

  // FILTERING BY ACTIVE LEVEL
  const allCoursesList = roomRepo.getAllCourses();
  const levelFilteredCourses = (isAdmin ? allCoursesList : courses).filter(
    (c) => c.level === activeLevel && availableSubjects.includes(c.subject)
  );

  // Subject and search query filtering
  const displayedCourses = levelFilteredCourses.filter((course) => {
    const matchesSubject = selectedSubject === "Tous" || course.subject === selectedSubject;
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Strict Level Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A237E] text-amber-300 font-black flex items-center justify-center text-xs shadow text-center p-1 leading-tight">
            {activeLevel}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Programme Officiel Sénégal — <span className="text-[#1A237E]">{activeLevel}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {isAdmin ? "Accès Administrateur : Vous pouvez consulter et gérer les dossiers de toutes les classes." : "Filtrage strict appliqué selon votre classe connectée."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && (
            <select
              value={adminLevel}
              onChange={(e) => {
                setAdminLevel(e.target.value as SecondaryLevel);
                setSelectedSubject("Tous");
              }}
              className="bg-white border-2 border-indigo-300 rounded-xl px-3 py-1.5 text-xs font-extrabold text-[#1A237E] shadow-xs cursor-pointer"
            >
              {ALL_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>Classe de {lvl}</option>
              ))}
            </select>
          )}
          <span className="text-xs font-bold text-indigo-900 bg-indigo-100 px-2.5 py-1.5 rounded-xl border border-indigo-200">
            {levelFilteredCourses.length} cours
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher une leçon, chapitre ou formule..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1A237E] focus:border-transparent text-slate-800 placeholder-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Subject Filter Chips */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
          <Filter size={12} />
          <span>Filtre par Matières :</span>
        </p>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedSubject("Tous")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedSubject === "Tous"
                ? "bg-[#1A237E] text-white shadow"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Toutes les matières
          </button>

          {availableSubjects.map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSubject === subj
                  ? "bg-[#1A237E] text-white shadow"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Course List */}
      {displayedCourses.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <BookOpen size={36} className="mx-auto text-slate-300 mb-2" />
          <h3 className="font-bold text-slate-700 text-sm">Aucun cours disponible</h3>
          <p className="text-xs text-slate-500 mt-1">
            Aucun cours ne correspond aux filtres sélectionnés en classe de {userLevel}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedCourses.map((course) => {
            const courseAssets = assets.filter((a) => a.parentId === course.id);
            return (
              <div
                key={course.id}
                onClick={() => onSelectCourse(course)}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-[#1A237E] font-bold text-xs rounded-lg border border-indigo-100">
                        {course.subject}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{course.chapter}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-[#1A237E] transition-colors">
                      {course.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isAdmin && (
                      <div className="flex items-center space-x-1.5 bg-amber-50 p-1 rounded-xl border border-amber-200" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditCourse(e, course)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] rounded-lg flex items-center space-x-1 transition-colors shadow-xs cursor-pointer"
                          title="Modifier cette leçon"
                        >
                          <Edit3 size={13} />
                          <span>Modifier</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCourse(e, course)}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] rounded-lg flex items-center space-x-1 transition-colors shadow-xs cursor-pointer"
                          title="Supprimer cette leçon"
                        >
                          <Trash2 size={13} />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    )}
                    <ChevronRight size={18} className="text-slate-400 group-hover:text-[#1A237E] transition-colors" />
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {course.summary}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1 font-medium">
                    <FileText size={12} className="text-indigo-600" />
                    <span>{courseAssets.length} ressource(s) associée(s)</span>
                  </span>
                  <span className="text-[#1A237E] font-semibold group-hover:underline">Consulter le cours →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Details Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#1A237E] text-white p-5 flex items-start justify-between">
              <div className="space-y-1 pr-4">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-amber-400 text-[#1A237E] font-black text-xs rounded-md">
                    {selectedCourse.subject}
                  </span>
                  <span className="text-xs text-indigo-200">{selectedCourse.chapter}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">{selectedCourse.title}</h3>
              </div>
              <button
                onClick={() => onSelectCourse(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-800">
              {/* Summary box & Video Capsule Launcher */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 space-y-3">
                <p>
                  <strong>Résumé : </strong>
                  {selectedCourse.summary}
                </p>

                <div className="pt-2 border-t border-indigo-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-900">
                    Capsule Vidéo de Cours Disponible :
                  </span>
                  <button
                    onClick={() => openVideoViewer(selectedCourse.title)}
                    className="px-3 py-1.5 bg-[#1A237E] hover:bg-indigo-900 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow transition-colors cursor-pointer"
                  >
                    <Play size={14} className="fill-white" />
                    <span>Visionner la Capsule Vidéo</span>
                  </button>
                </div>
              </div>

              {/* Main Text Content */}
              <div className="prose prose-sm max-w-none text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed">
                {selectedCourse.content.split("\n\n").map((paragraph, idx) => (
                  <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {paragraph.startsWith("##") ? (
                      <h4 className="font-bold text-[#1A237E] text-sm mb-1">
                        {paragraph.replace("## ", "")}
                      </h4>
                    ) : (
                      <p className="whitespace-pre-line text-slate-700">{paragraph}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Linked Assets Section */}
              {(() => {
                const linked = assets.filter((a) => a.parentId === selectedCourse.id);
                if (linked.length === 0) return null;
                return (
                  <div className="border-t border-slate-200 pt-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <FileText size={14} className="text-[#1A237E]" />
                      <span>Fichiers & Sujets d'Examen Associés (Room Cache)</span>
                    </h4>

                    <div className="space-y-2">
                      {linked.map((ast) => (
                        <div
                          key={ast.assetId}
                          className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center uppercase">
                              {ast.type}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{ast.name}</p>
                              <p className="text-[10px] text-slate-500">
                                {ast.size} • Path: {ast.storagePath}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => openAssetViewer(ast)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#1A237E] rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                              title="Lire le fichier dans l'application"
                            >
                              <Eye size={14} />
                              <span>Ouvrir</span>
                            </button>

                            <button
                              onClick={() => onToggleCacheAsset(ast.assetId)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                                ast.isCachedOffline
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {ast.isCachedOffline ? (
                                <>
                                  <CheckCircle size={14} />
                                  <span>En cache Room</span>
                                </>
                              ) : (
                                <>
                                  <Download size={14} />
                                  <span>Mettre en cache</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {onStartQuizForSubject && (
                  <button
                    onClick={() => {
                      onSelectCourse(null);
                      onStartQuizForSubject(selectedCourse.subject);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Passer un Quiz sur ce sujet</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => {
                      const c = selectedCourse;
                      onSelectCourse(null);
                      setEditingCourse(c);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>Modifier ce Cours (Admin)</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => onSelectCourse(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors ml-auto cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document / Media Interactive Viewer Modal */}
      <DocumentViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        asset={viewerAsset}
        videoUrl={viewerVideoUrl}
        title={viewerTitle}
        onToggleCacheAsset={onToggleCacheAsset}
      />

      {/* Admin Edit Course Modal */}
      <EditCourseModal
        course={editingCourse}
        isOpen={Boolean(editingCourse)}
        onClose={() => setEditingCourse(null)}
      />
    </div>
  );
};
