import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Star, Send, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSubmissions, addReview } from '../services/submissionService';
import { useAuth } from '../hooks/useAuth';
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

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`w-5 h-5 ${s <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
        </button>
      ))}
    </div>
  );
}

function SubmissionCard({ submission, currentUserId, onReview }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isOwn = submission.userId?._id === currentUserId;
  const avgRating = submission.reviews?.length > 0
    ? (submission.reviews.reduce((s, r) => s + r.rating, 0) / submission.reviews.length).toFixed(1)
    : null;

  const handleReview = async () => {
    setSubmitting(true);
    try {
      const updated = await onReview(submission._id, { rating, comment });
      toast.success('Review submitted!');
      setReviewOpen(false);
      setComment('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {submission.userId?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{submission.userId?.name}</p>
              <p className="text-xs text-slate-400">{timeAgo(submission.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {avgRating && (
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {avgRating} ({submission.reviews?.length})
              </div>
            )}
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
              {submission.language}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {submission.courseId?.title} — {submission.lessonId?.title}
          </p>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Hide code' : 'View code'}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.pre
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 bg-slate-900 text-green-400 text-xs font-mono p-4 rounded-xl overflow-auto max-h-64 overflow-hidden"
            >
              <code>{submission.code}</code>
            </motion.pre>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 mt-4">
          {!isOwn && (
            <button
              onClick={() => setReviewOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 px-3 py-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Leave Review
            </button>
          )}
          {submission.reviews?.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">{submission.reviews.length} reviews</span>
          )}
        </div>

        <AnimatePresence>
          {reviewOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
                <StarRating value={rating} onChange={setRating} />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Your feedback..."
                  rows={2}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={handleReview}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function PeerReview() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubmissions()
      .then((r) => setSubmissions(r.data.data))
      .catch(() => toast.error('Failed to load submissions'))
      .finally(() => setLoading(false));
  }, []);

  const handleReview = async (id, data) => {
    const r = await addReview(id, data);
    setSubmissions((prev) => prev.map((s) => s._id === id ? r.data.data : s));
    return r.data.data;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary,#F8FAFC)] dark:bg-slate-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Peer Code Review</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Review and get feedback on code submissions</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16">
            <Code2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No submissions yet.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Submit your solutions from the course viewer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <SubmissionCard
                key={sub._id}
                submission={sub}
                currentUserId={user?._id}
                onReview={handleReview}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
