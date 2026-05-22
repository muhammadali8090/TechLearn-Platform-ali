import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StickyNote, BookOpen, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { getNotes, deleteNote } from '../services/noteService';
import Navbar from '../components/Navbar';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function MyNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotes()
      .then((r) => setNotes(r.data.data))
      .catch(() => toast.error('Failed to load notes'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary,#F8FAFC)] dark:bg-slate-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
            <StickyNote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">My Notes</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">All your lesson notes in one place</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-16">
            <StickyNote className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No notes yet.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Take notes while studying inside a course viewer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {notes.map((note, idx) => (
              <motion.div
                key={note._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 truncate">{note.courseId?.title}</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{note.lessonId?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {note.courseId?.slug && (
                      <Link
                        to={`/learn/${note.courseId.slug}`}
                        className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(note._id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                  {note.content || <span className="italic text-slate-400">No content</span>}
                </p>

                {note.highlights?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {note.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full font-medium text-slate-700"
                        style={{ backgroundColor: h.color || '#fde68a' }}
                      >
                        {h.text?.slice(0, 30)}...
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Updated {timeAgo(note.updatedAt)}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
