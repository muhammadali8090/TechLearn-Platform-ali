import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Trophy, Send, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { getChallenges, createChallenge, submitChallenge } from '../services/challengeService';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

function useCountdown(deadline) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(deadline) - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h` : `${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return timeLeft;
}

const difficultyConfig = {
  easy: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  medium: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  hard: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
};

function ChallengeCard({ challenge, onSubmit, userId }) {
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState(challenge.starterCode || '');
  const [submitting, setSubmitting] = useState(false);
  const timeLeft = useCountdown(challenge.deadline);
  const isExpired = timeLeft === 'Ended';
  const hasSubmitted = challenge.submissions?.some((s) => s.userId === userId);
  const topSubmissions = challenge.submissions
    ?.filter((s) => s.passed)
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
    .slice(0, 5);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(challenge._id, code);
      toast.success('Solution submitted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
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
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{challenge.title}</h3>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${difficultyConfig[challenge.difficulty]}`}>
            {challenge.difficulty}
          </span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">{challenge.description}</p>

        <div className="flex items-center gap-4 text-xs mb-4">
          <div className={`flex items-center gap-1.5 font-semibold ${isExpired ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
            <Clock className="w-3.5 h-3.5" />
            {isExpired ? 'Ended' : timeLeft}
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Trophy className="w-3.5 h-3.5" />
            {challenge.submissions?.length || 0} submissions
          </div>
          {hasSubmitted && (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Submitted</span>
          )}
        </div>

        {!isExpired && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? 'Hide editor' : 'Submit solution'}
          </button>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={8}
                className="w-full bg-slate-900 text-green-400 font-mono text-sm p-4 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Write your solution here..."
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !code.trim()}
                className="mt-3 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Solution'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {topSubmissions?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Top submissions</p>
            <div className="space-y-1.5">
              {topSubmissions.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 w-5">#{i + 1}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{s.userId?.name || 'Student'}</span>
                  <span className="ml-auto text-slate-400">{new Date(s.submittedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Challenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', starterCode: '', difficulty: 'medium',
    deadline: '', testCases: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getChallenges()
      .then((r) => setChallenges(r.data.data))
      .catch(() => toast.error('Failed to load challenges'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.deadline) {
      toast.error('Title, description and deadline are required');
      return;
    }
    setCreating(true);
    try {
      const r = await createChallenge({
        ...form,
        testCases: form.testCases
          ? form.testCases.split('\n').map((l) => ({ input: l, expectedOutput: '' }))
          : [],
      });
      setChallenges((prev) => [r.data.data, ...prev]);
      setCreateOpen(false);
      setForm({ title: '', description: '', starterCode: '', difficulty: 'medium', deadline: '', testCases: '' });
      toast.success('Challenge created!');
    } catch {
      toast.error('Failed to create challenge');
    } finally {
      setCreating(false);
    }
  };

  const handleSubmit = async (id, code) => {
    await submitChallenge(id, code);
    const r = await getChallenges();
    setChallenges(r.data.data);
  };

  const now = new Date();
  const active = challenges.filter((c) => new Date(c.deadline) > now);
  const past = challenges.filter((c) => new Date(c.deadline) <= now);

  return (
    <div className="min-h-screen bg-[var(--bg-primary,#F8FAFC)] dark:bg-slate-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Weekly Challenges</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Compete, learn, and climb the ranks</p>
            </div>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> New Challenge
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Active Challenges
                </h2>
                <div className="space-y-4">
                  {active.map((c) => (
                    <ChallengeCard key={c._id} challenge={c} onSubmit={handleSubmit} userId={user?._id} />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 text-opacity-60">
                  Past Challenges
                </h2>
                <div className="space-y-4 opacity-70">
                  {past.map((c) => (
                    <ChallengeCard key={c._id} challenge={c} onSubmit={handleSubmit} userId={user?._id} />
                  ))}
                </div>
              </div>
            )}

            {challenges.length === 0 && (
              <div className="text-center py-16">
                <Zap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No challenges yet.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Challenge Modal */}
      <AnimatePresence>
        {createOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setCreateOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-0 mx-auto top-1/2 -translate-y-1/2 max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 z-50 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Create Challenge</h2>
              <div className="space-y-3">
                <input
                  type="text" placeholder="Title" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <textarea
                  placeholder="Description" value={form.description} rows={3}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <textarea
                  placeholder="Starter code (optional)" value={form.starterCode} rows={3}
                  onChange={(e) => setForm((f) => ({ ...f, starterCode: e.target.value }))}
                  className="w-full bg-slate-900 text-green-400 font-mono text-sm rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div className="flex gap-3">
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                    className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <input
                    type="datetime-local" value={form.deadline}
                    onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                    className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >Cancel</button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >{creating ? 'Creating...' : 'Create'}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
