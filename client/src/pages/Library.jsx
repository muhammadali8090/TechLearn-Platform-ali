import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookMarked, Download, FileText, Archive, ExternalLink, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLibrary, unsaveResource } from '../services/libraryService';
import Navbar from '../components/Navbar';

function resourceIcon(name) {
  const lower = name?.toLowerCase() || '';
  if (lower.endsWith('.pdf') || lower.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
  if (lower.endsWith('.zip') || lower.includes('zip')) return <Archive className="w-5 h-5 text-amber-500" />;
  return <FileText className="w-5 h-5 text-blue-500" />;
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Library() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLibrary()
      .then((r) => setGroups(r.data.data))
      .catch(() => toast.error('Failed to load library'))
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = async (lessonId, resourceIndex, courseIdx, resIdx) => {
    try {
      await unsaveResource({ lessonId, resourceIndex });
      setGroups((prev) => {
        const updated = [...prev];
        updated[courseIdx] = {
          ...updated[courseIdx],
          resources: updated[courseIdx].resources.filter((_, i) => i !== resIdx),
        };
        return updated.filter((g) => g.resources.length > 0);
      });
      toast.success('Removed from library');
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary,#F8FAFC)] dark:bg-slate-900">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Resource Library</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Your saved course resources</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <BookMarked className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No saved resources yet.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Save resources from course lessons using the bookmark button.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group, courseIdx) => (
              <motion.div
                key={group.course?._id || courseIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: courseIdx * 0.06 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={group.course?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&q=60'}
                    alt={group.course?.title}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <Link
                    to={`/courses/${group.course?.slug}`}
                    className="font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
                  >
                    {group.course?.title}
                    <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.resources.map((res, resIdx) => (
                    <div
                      key={res._id}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-start gap-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-shrink-0 mt-0.5">{resourceIcon(res.resourceName)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{res.resourceName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{res.lessonId?.title}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Saved {timeAgo(res.createdAt)}</p>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleUnsave(res.lessonId?._id, res.resourceIndex, courseIdx, resIdx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
