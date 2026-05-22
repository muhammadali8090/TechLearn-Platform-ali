import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Circle, ChevronLeft, ChevronRight, BookOpen, Code,
  HelpCircle, FileText, ExternalLink, Award, Menu, X, Play,
  Bookmark, StickyNote, Zap, FileArchive, Download, Archive, Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCourseBySlug, getCourseProgress, completeLesson, submitQuiz,
  submitChallenge, downloadResource,
} from '../services/courseService';
import { addBookmark, removeBookmark, getBookmarks } from '../services/userService';
import { getNotes, upsertNote } from '../services/noteService';
import { saveResource, unsaveResource, getLibrary } from '../services/libraryService';
import { createSubmission } from '../services/submissionService';
import { useAuth } from '../hooks/useAuth';
import ProgressBar from '../components/ProgressBar';

// Confetti particle component
function ConfettiParticle({ style }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm pointer-events-none"
      style={style}
      initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
      animate={{
        opacity: 0,
        y: -120 + Math.random() * -80,
        x: (Math.random() - 0.5) * 140,
        rotate: Math.random() * 360,
      }}
      transition={{ duration: 0.9 + Math.random() * 0.5, ease: 'easeOut' }}
    />
  );
}

const CONFETTI_COLORS = [
  'bg-indigo-400', 'bg-violet-400', 'bg-emerald-400', 'bg-amber-400',
  'bg-pink-400', 'bg-sky-400', 'bg-orange-400',
];

export default function CourseViewer() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [completingLesson, setCompletingLesson] = useState(false);

  // New UI state
  const [notesOpen, setNotesOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem('learnify-focus') === 'true');
  const [noteText, setNoteText] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [confetti, setConfetti] = useState([]);
  const [downloadingIdx, setDownloadingIdx] = useState(null);
  const noteDebounceRef = useRef(null);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // Coding challenge state
  const [codeInput, setCodeInput] = useState('');
  const [challengeResult, setChallengeResult] = useState(null);

  // Video timestamp note
  const [timestampSeconds, setTimestampSeconds] = useState(0);

  // Library saved resources
  const [savedResources, setSavedResources] = useState(new Set());

  // Peer review submission
  const [peerSubmitOpen, setPeerSubmitOpen] = useState(false);

  const allLessons = course?.sections?.sort((a, b) => a.order - b.order).flatMap((s) => s.lessons) || [];

  useEffect(() => {
    Promise.all([getCourseBySlug(slug)])
      .then(([courseRes]) => {
        const c = courseRes.data.data;
        setCourse(c);
        // Check URL param for pre-selected lesson
        const lessonParam = searchParams.get('lesson');
        const allL = c.sections?.sort((a, b) => a.order - b.order).flatMap((s) => s.lessons) || [];
        const target = lessonParam ? allL.find((l) => l._id === lessonParam) : allL[0];
        if (target) setActiveLesson(target);
      })
      .catch(() => {
        toast.error('Failed to load course');
        navigate('/courses');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (course) {
      getCourseProgress(course._id).then((r) => setProgress(r.data.data)).catch(() => {});
      getBookmarks().then((r) => setBookmarks(r.data.data)).catch(() => {});
      getLibrary().then((r) => {
        const keys = new Set();
        r.data.data.forEach((group) => {
          group.resources?.forEach((res) => {
            keys.add(`${res.lessonId?._id || res.lessonId}-${res.resourceIndex}`);
          });
        });
        setSavedResources(keys);
      }).catch(() => {});
    }
  }, [course]);

  useEffect(() => {
    if (activeLesson) {
      setLessonData(activeLesson);
      setQuizAnswers({});
      setQuizResult(null);
      setChallengeResult(null);
      setVideoLoaded(false);
      setCodeInput(activeLesson.codingChallenge?.starterCode || '');
      setConfetti([]);

      // Load note from API (fallback to localStorage)
      if (course) {
        getNotes({ lessonId: activeLesson._id })
          .then((r) => {
            const note = r.data.data?.[0];
            const text = note?.content || localStorage.getItem(`note-${course._id}-${activeLesson._id}`) || '';
            setNoteText(text);
            setCharCount(text.length);
          })
          .catch(() => {
            const saved = localStorage.getItem(`note-${course._id}-${activeLesson._id}`) || '';
            setNoteText(saved);
            setCharCount(saved.length);
          });
      }
    }
  }, [activeLesson]);

  const isCompleted = (lessonId) =>
    progress?.completedLessons?.some((l) => l.lessonId?.toString() === lessonId?.toString());

  const isBookmarked = (lessonId) =>
    bookmarks.some((b) => b.lesson?._id?.toString() === lessonId?.toString());

  const getBookmarkId = (lessonId) =>
    bookmarks.find((b) => b.lesson?._id?.toString() === lessonId?.toString())?._id;

  const handleComplete = async () => {
    if (!activeLesson || !course) return;
    const alreadyDone = isCompleted(activeLesson._id);
    setCompletingLesson(true);
    try {
      const res = await completeLesson(course._id, activeLesson._id);
      setProgress(res.data.data);
      toast.success('Lesson marked as complete!');
      // Fire confetti if newly completed
      if (!alreadyDone) {
        const particles = Array.from({ length: 20 }, (_, i) => ({
          id: i,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        }));
        setConfetti(particles);
        setTimeout(() => setConfetti([]), 1500);
      }
    } catch {
      toast.error('Failed to mark complete');
    } finally {
      setCompletingLesson(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!activeLesson || !course || bookmarkLoading) return;
    setBookmarkLoading(true);
    const lessonId = activeLesson._id;
    const courseId = course._id;

    if (isBookmarked(lessonId)) {
      const bookmarkId = getBookmarkId(lessonId);
      // Optimistic remove
      setBookmarks((prev) => prev.filter((b) => b._id !== bookmarkId));
      try {
        await removeBookmark(bookmarkId);
        toast.success('Bookmark removed');
      } catch {
        toast.error('Failed to remove bookmark');
        getBookmarks().then((r) => setBookmarks(r.data.data)).catch(() => {});
      }
    } else {
      // Optimistic add
      const optimistic = { _id: `temp-${Date.now()}`, lesson: { _id: lessonId }, course: { _id: courseId }, note: '', savedAt: new Date() };
      setBookmarks((prev) => [...prev, optimistic]);
      try {
        const res = await addBookmark(courseId, lessonId);
        // Replace optimistic with real
        setBookmarks((prev) => [...prev.filter((b) => b._id !== optimistic._id), {
          ...res.data.data,
          lesson: { _id: lessonId, title: activeLesson.title },
          course: { _id: courseId, slug: course.slug },
        }]);
        toast.success('Lesson bookmarked!');
      } catch (err) {
        toast.error(err?.response?.data?.error || 'Failed to bookmark');
        setBookmarks((prev) => prev.filter((b) => b._id !== optimistic._id));
      }
    }
    setBookmarkLoading(false);
  };

  const handleNoteChange = (value) => {
    setNoteText(value);
    setCharCount(value.length);
    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
    noteDebounceRef.current = setTimeout(() => {
      if (course && activeLesson) {
        localStorage.setItem(`note-${course._id}-${activeLesson._id}`, value);
        upsertNote({ lessonId: activeLesson._id, courseId: course._id, content: value }).catch(() => {});
      }
    }, 800);
  };

  const handleToggleSaveResource = async (resource, idx) => {
    if (!course || !activeLesson) return;
    const key = `${activeLesson._id}-${idx}`;
    const isSaved = savedResources.has(key);
    try {
      if (isSaved) {
        await unsaveResource({ lessonId: activeLesson._id, resourceIndex: idx });
        setSavedResources((prev) => { const next = new Set(prev); next.delete(key); return next; });
        toast.success('Removed from library');
      } else {
        await saveResource({
          courseId: course._id,
          lessonId: activeLesson._id,
          resourceIndex: idx,
          resourceName: resource.name,
          url: resource.url,
        });
        setSavedResources((prev) => new Set([...prev, key]));
        toast.success('Saved to library!');
      }
    } catch {
      toast.error('Failed to update library');
    }
  };

  const handlePeerSubmit = async () => {
    if (!course || !activeLesson || !codeInput.trim()) return;
    try {
      await createSubmission({
        lessonId: activeLesson._id,
        courseId: course._id,
        code: codeInput,
        language: activeLesson.codingChallenge?.language || 'javascript',
      });
      setPeerSubmitOpen(false);
      toast.success('Submitted for peer review!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    }
  };

  const handleSaveTimestampNote = () => {
    if (!course || !activeLesson) return;
    const mins = Math.floor(timestampSeconds / 60);
    const secs = timestampSeconds % 60;
    const stamp = `[${mins}:${secs.toString().padStart(2, '0')}]`;
    const updated = noteText ? `${noteText}\n${stamp} ` : `${stamp} `;
    handleNoteChange(updated);
    setNotesOpen(true);
    toast.success(`Timestamp ${stamp} added to notes`);
  };

  const toggleFocusMode = () => {
    const next = !focusMode;
    setFocusMode(next);
    localStorage.setItem('learnify-focus', String(next));
    setSidebarOpen(false);
  };

  const handleQuizSubmit = async () => {
    if (!course || !activeLesson) return;
    const questions = activeLesson.quiz?.questions || [];
    const answers = questions.map((_, i) => quizAnswers[i] ?? -1);
    setQuizSubmitting(true);
    try {
      const res = await submitQuiz(course._id, activeLesson._id, answers);
      setQuizResult(res.data.data);
      toast.success(`Quiz score: ${res.data.data.score}%`);
    } catch {
      toast.error('Failed to submit quiz');
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleChallengeSubmit = async () => {
    if (!course || !activeLesson) return;
    const passed = codeInput.trim().length > 10;
    try {
      await submitChallenge(course._id, activeLesson._id, passed);
      setChallengeResult({
        passed,
        message: passed ? 'Challenge submitted! Keep it up.' : 'Try to write a more complete solution.',
      });
      toast.success(passed ? 'Challenge passed!' : 'Challenge submitted');
    } catch {
      toast.error('Failed to submit');
    }
  };

  const handleResourceDownload = async (resource, idx) => {
    if (!course || !activeLesson) return;
    setDownloadingIdx(idx);
    try {
      const res = await downloadResource(course._id, activeLesson._id, idx);
      window.open(res.data.data.url, '_blank');
      toast.success('Download started!');
      // Update local downloadCount
      setLessonData((prev) => {
        if (!prev) return prev;
        const resources = [...prev.resources];
        resources[idx] = { ...resources[idx], downloadCount: res.data.data.downloadCount };
        return { ...prev, resources };
      });
    } catch {
      // Fall back to direct link
      window.open(resource.url, '_blank');
    } finally {
      setDownloadingIdx(null);
    }
  };

  const navigateLesson = (dir) => {
    const idx = allLessons.findIndex((l) => l._id === activeLesson?._id);
    const next = allLessons[idx + dir];
    if (next) setActiveLesson(next);
  };

  const currentIdx = allLessons.findIndex((l) => l._id === activeLesson?._id);

  const getResourceIcon = (type) => {
    if (type === 'pdf') return FileText;
    if (type === 'zip') return Archive;
    return ExternalLink;
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <motion.div
        className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] transition-colors duration-300 relative">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Notes Drawer Overlay */}
      <AnimatePresence>
        {notesOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-30"
            onClick={() => setNotesOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Notes Slide-in Drawer */}
      <AnimatePresence>
        {notesOpen && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-screen w-80 bg-[var(--bg-card)] border-l border-[var(--border)] z-40 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-[var(--text-primary)] text-sm">Lesson Notes</span>
              </div>
              <button onClick={() => setNotesOpen(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex flex-col p-4 gap-3">
              <p className="text-xs text-[var(--text-muted)]">
                Notes for: <span className="font-medium text-[var(--text-primary)]">{activeLesson?.title}</span>
              </p>
              <textarea
                value={noteText}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Write your notes here..."
                className="flex-1 w-full bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-xl p-3 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
              />
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{charCount} characters</span>
                <span className="text-emerald-500 font-medium">Auto-saved</span>
              </div>

              {/* Timestamp note */}
              <div className="border-t border-[var(--border)] pt-3">
                <p className="text-xs font-semibold text-[var(--text-primary)] mb-2">Add timestamp note</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={timestampSeconds}
                    onChange={(e) => setTimestampSeconds(Number(e.target.value))}
                    min={0}
                    placeholder="seconds"
                    className="w-24 bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSaveTimestampNote}
                    className="flex-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                  >
                    + Add at {Math.floor(timestampSeconds / 60)}:{(timestampSeconds % 60).toString().padStart(2, '0')}
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen bg-[#0F172A] dark:bg-[#0A0F1E] text-white flex flex-col z-40 transition-all duration-300 ${
          focusMode ? 'w-0 overflow-hidden lg:w-0' : 'w-72'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <Link
              to={`/courses/${slug}`}
              className="flex items-center gap-2 text-indigo-400 text-sm font-medium hover:text-indigo-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Course Detail
            </Link>
            <button className="lg:hidden p-1 text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="font-bold text-sm text-white line-clamp-2 mb-3">{course?.title}</h2>
          {progress && (
            <div>
              <ProgressBar value={progress.overallPercent} height="h-1.5" />
              <p className="text-xs text-slate-400 mt-1.5">{progress.overallPercent}% complete</p>
            </div>
          )}
        </div>

        {/* Lessons List */}
        <div className="flex-1 overflow-y-auto py-3">
          {course?.sections?.sort((a, b) => a.order - b.order).map((section) => (
            <div key={section._id || section.title} className="mb-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-5 py-2">
                {section.title}
              </p>
              {section.lessons?.map((lesson) => {
                const done = isCompleted(lesson._id);
                const active = activeLesson?._id === lesson._id;
                const bookmarked = isBookmarked(lesson._id);
                return (
                  <motion.button
                    key={lesson._id}
                    onClick={() => { setActiveLesson(lesson); setSidebarOpen(false); }}
                    whileHover={{ x: active ? 0 : 4 }}
                    className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors relative ${
                      active
                        ? 'bg-indigo-600/30 text-white border-l-2 border-indigo-500'
                        : 'hover:bg-slate-800/60 text-slate-300 border-l-2 border-transparent'
                    }`}
                  >
                    {done ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : active ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Play className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      </motion.div>
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    )}
                    <span className="text-sm line-clamp-2 leading-snug flex-1">{lesson.title}</span>
                    {bookmarked && <Bookmark className="w-3 h-3 text-indigo-400 flex-shrink-0" fill="currentColor" />}
                  </motion.button>
                );
              })}
            </div>
          ))}

          {/* Final Exam */}
          {course?.finalExam && (
            <div className="px-4 mt-2 pt-4 border-t border-slate-700/50">
              <Link
                to={`/exam/${course._id}`}
                className="flex items-center gap-3 px-3 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors"
              >
                <Award className="w-4 h-4" />
                <span className="text-sm font-semibold">Final Exam</span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <div className="bg-[var(--bg-card)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFocusMode}
              title={focusMode ? 'Exit focus mode' : 'Focus mode'}
              className={`hidden lg:flex p-2 rounded-lg transition-colors ${
                focusMode
                  ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] min-w-0 flex-1 px-2">
            <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span className="font-medium text-[var(--text-primary)] truncate">{activeLesson?.title}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Notes toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setNotesOpen((v) => !v)}
              title="Lesson notes"
              className={`p-2 rounded-lg transition-colors ${
                notesOpen
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-slate-700'
              } ${noteText ? 'text-amber-500' : ''}`}
            >
              <StickyNote className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateLesson(-1)}
              disabled={currentIdx <= 0}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateLesson(1)}
              disabled={currentIdx >= allLessons.length - 1}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          <AnimatePresence mode="wait">
            {lessonData && (
              <motion.div
                key={lessonData._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Video */}
                {lessonData.videoUrl && (
                  <div className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-2xl">
                    <AnimatePresence>
                      {!videoLoaded && (
                        <motion.div
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 skeleton-shimmer flex items-center justify-center"
                        >
                          <div className="w-12 h-12 border-4 border-indigo-500/50 border-t-indigo-500 rounded-full animate-spin" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <iframe
                      src={lessonData.videoUrl}
                      title={lessonData.title}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      onLoad={() => setVideoLoaded(true)}
                      style={{ opacity: videoLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
                    />
                  </div>
                )}

                {/* Lesson Info */}
                <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm relative overflow-hidden">
                  {/* Confetti origin */}
                  <div className="absolute left-1/2 bottom-8 pointer-events-none">
                    {confetti.map((p) => (
                      <ConfettiParticle
                        key={p.id}
                        style={{ left: `${(Math.random() - 0.5) * 40}px`, top: 0 }}
                      />
                    ))}
                  </div>

                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div>
                          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{lessonData.title}</h1>
                          <p className="text-[var(--text-muted)] leading-relaxed">{lessonData.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Bookmark toggle */}
                      <motion.button
                        onClick={handleBookmarkToggle}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        disabled={bookmarkLoading}
                        title={isBookmarked(lessonData._id) ? 'Remove bookmark' : 'Bookmark this lesson'}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isBookmarked(lessonData._id)
                            ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700/50 text-indigo-600 dark:text-indigo-400'
                            : 'border-[var(--border)] text-[var(--text-muted)] hover:text-indigo-500 hover:border-indigo-300 dark:hover:border-indigo-600'
                        }`}
                      >
                        <Bookmark
                          className="w-4 h-4"
                          fill={isBookmarked(lessonData._id) ? 'currentColor' : 'none'}
                        />
                      </motion.button>

                      {/* Mark complete */}
                      <motion.button
                        onClick={handleComplete}
                        disabled={completingLesson}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                          isCompleted(lessonData._id)
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                            : 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25 hover:opacity-90'
                        } ${completingLesson ? 'animate-pop-scale' : ''}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isCompleted(lessonData._id) ? 'Completed ✓' : completingLesson ? 'Saving...' : 'Mark Complete'}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Resources */}
                {lessonData.resources?.length > 0 && (
                  <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm">
                    <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      Resources
                    </h3>
                    <div className="space-y-3">
                      {lessonData.resources.map((r, i) => {
                        const Icon = getResourceIcon(r.type);
                        const isDownloading = downloadingIdx === i;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-[var(--border)] hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              r.type === 'pdf' ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                              : r.type === 'zip' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{r.name}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {r.fileSize && (
                                  <span className="text-xs text-[var(--text-muted)] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                    {r.fileSize}
                                  </span>
                                )}
                                <span className="text-xs text-[var(--text-muted)] uppercase font-medium">{r.type}</span>
                                {r.downloadCount > 0 && (
                                  <span className="text-xs text-[var(--text-muted)]">
                                    {r.downloadCount} download{r.downloadCount !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleToggleSaveResource(r, i)}
                                title={savedResources.has(`${lessonData._id}-${i}`) ? 'Remove from library' : 'Save to library'}
                                className={`p-2 rounded-xl border transition-colors ${
                                  savedResources.has(`${lessonData._id}-${i}`)
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                                    : 'border-[var(--border)] text-[var(--text-muted)] hover:text-emerald-500 hover:border-emerald-300'
                                }`}
                              >
                                <Bookmark className="w-3.5 h-3.5" fill={savedResources.has(`${lessonData._id}-${i}`) ? 'currentColor' : 'none'} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleResourceDownload(r, i)}
                                disabled={isDownloading}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                              >
                                {isDownloading ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                {isDownloading ? 'Opening...' : 'Download'}
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quiz */}
                {lessonData.quiz?.questions?.length > 0 && (
                  <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm">
                    <h3 className="font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2 text-lg">
                      <HelpCircle className="w-5 h-5 text-indigo-500" />
                      Lesson Quiz
                    </h3>
                    <div className="space-y-6">
                      {lessonData.quiz.questions.map((q, qi) => (
                        <div key={qi} className="border border-[var(--border)] rounded-xl p-5">
                          <p className="font-semibold text-[var(--text-primary)] mb-4">
                            {qi + 1}. {q.question}
                          </p>
                          <div className="space-y-2">
                            {q.options.map((opt, oi) => {
                              const isSelected = quizAnswers[qi] === oi;
                              const resultQ = quizResult?.questions?.[qi];
                              const isCorrect = resultQ?.correctIndex === oi;
                              const isWrong = resultQ && isSelected && !resultQ.correct;

                              let cls = 'border-[var(--border)] bg-slate-50 dark:bg-slate-800/30 hover:border-indigo-400 dark:hover:border-indigo-600';
                              if (quizResult) {
                                if (isCorrect) cls = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30';
                                else if (isWrong) cls = 'border-red-400 bg-red-50 dark:bg-red-950/30';
                              } else if (isSelected) {
                                cls = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40';
                              }

                              return (
                                <motion.label
                                  key={oi}
                                  whileHover={!quizResult ? { scale: 1.01 } : {}}
                                  whileTap={!quizResult ? { scale: 0.99 } : {}}
                                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${cls}`}
                                >
                                  <input
                                    type="radio"
                                    name={`q-${qi}`}
                                    checked={isSelected}
                                    onChange={() => !quizResult && setQuizAnswers({ ...quizAnswers, [qi]: oi })}
                                    disabled={!!quizResult}
                                    className="text-indigo-500 accent-indigo-500"
                                  />
                                  <span className="text-sm text-[var(--text-primary)]">{opt}</span>
                                </motion.label>
                              );
                            })}
                          </div>
                          {quizResult?.questions?.[qi]?.explanation && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3 text-sm text-[var(--text-muted)] bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-3 border border-[var(--border)]"
                            >
                              <span className="font-semibold text-[var(--text-primary)]">Explanation:</span>{' '}
                              {quizResult.questions[qi].explanation}
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>

                    {quizResult ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`mt-6 p-4 rounded-xl text-center font-bold ${
                          quizResult.score >= 70
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        Score: {quizResult.score}% ({quizResult.correct}/{quizResult.total} correct)
                        <button
                          onClick={() => { setQuizResult(null); setQuizAnswers({}); }}
                          className="block mx-auto mt-2 text-sm font-medium underline opacity-70 hover:opacity-100"
                        >
                          Retake Quiz
                        </button>
                      </motion.div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleQuizSubmit}
                        disabled={quizSubmitting || Object.keys(quizAnswers).length < lessonData.quiz.questions.length}
                        className="mt-6 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20"
                      >
                        {quizSubmitting ? 'Submitting...' : 'Submit Quiz'}
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Coding Challenge */}
                {lessonData.codingChallenge?.prompt && (
                  <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm">
                    <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 text-lg">
                      <Code className="w-5 h-5 text-indigo-500" />
                      Coding Challenge
                    </h3>
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4 mb-5">
                      <p className="text-[var(--text-primary)] font-medium text-sm leading-relaxed">
                        {lessonData.codingChallenge.prompt}
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161B22] rounded-t-xl border border-[#30363D]">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
                          </div>
                          <span className="text-xs text-slate-500 ml-2 font-mono">
                            solution.{lessonData.codingChallenge.language || 'js'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono capitalize">
                          {lessonData.codingChallenge.language || 'javascript'}
                        </span>
                      </div>
                      <div className="relative">
                        <textarea
                          value={codeInput}
                          onChange={(e) => { setChallengeResult(null); setCodeInput(e.target.value); }}
                          rows={12}
                          className="w-full font-mono text-sm bg-[#0D1117] text-[#C9D1D9] p-4 pl-12 rounded-b-xl border border-t-0 border-[#30363D] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y leading-6"
                          spellCheck={false}
                          style={{ tabSize: 2 }}
                        />
                        <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col pt-4 pb-4 items-end pr-2 pointer-events-none select-none" style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.5rem' }}>
                          {codeInput.split('\n').map((_, i) => (
                            <span key={i} className="text-[#484f58] leading-6 w-full text-right pr-1">{i + 1}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {challengeResult && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-4 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
                          challengeResult.passed
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                        }`}
                      >
                        {challengeResult.passed ? '✓' : '⚠'} {challengeResult.message}
                      </motion.div>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleChallengeSubmit}
                        className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-[length:200%] text-white font-semibold px-6 py-2.5 rounded-xl hover:animate-gradient-shift transition-all shadow-md shadow-indigo-500/25"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <Code className="w-4 h-4" />
                          Run Code
                        </span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handlePeerSubmit}
                        disabled={!codeInput.trim()}
                        className="flex items-center gap-2 border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/30 disabled:opacity-50 transition-colors text-sm"
                      >
                        <Zap className="w-4 h-4" />
                        Submit for Peer Review
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between gap-4 pb-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigateLesson(-1)}
                    disabled={currentIdx <= 0}
                    className="flex items-center gap-2 px-5 py-2.5 border border-[var(--border)] bg-[var(--bg-card)] rounded-xl text-[var(--text-primary)] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </motion.button>

                  {currentIdx < allLessons.length - 1 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigateLesson(1)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md shadow-indigo-500/20"
                    >
                      Next Lesson
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <Link
                      to={`/exam/${course?._id}`}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md shadow-amber-500/20"
                    >
                      <Award className="w-4 h-4" />
                      Take Final Exam
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
