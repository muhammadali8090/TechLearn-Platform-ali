import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, MessageSquare, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMentors, requestMentor, getMyMentorships, sendMessage } from '../services/mentorshipService';
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

const statusConfig = {
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300', icon: Clock },
  active: { label: 'Active', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300', icon: CheckCircle },
  closed: { label: 'Closed', color: 'text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400', icon: XCircle },
};

function ChatThread({ session, onSend, currentUserId }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const statusCfg = statusConfig[session.status] || statusConfig.pending;
  const StatusIcon = statusCfg.icon;

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSend(session._id, text.trim());
      setText('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const other = currentUserId === session.studentId?._id
    ? session.mentorId
    : session.studentId;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
            {other?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{other?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{currentUserId === session.studentId?._id ? 'Mentor' : 'Student'}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
          <StatusIcon className="w-3 h-3" /> {statusCfg.label}
        </span>
      </div>

      {session.goalStatement && (
        <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/40">
          <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">Goal: {session.goalStatement}</p>
        </div>
      )}

      <div className="h-56 overflow-y-auto p-4 space-y-3">
        {session.messages?.length === 0 && (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
            No messages yet. Start the conversation!
          </div>
        )}
        {session.messages?.map((msg) => {
          const isMe = msg.senderId?._id === currentUserId || msg.senderId === currentUserId;
          return (
            <div key={msg._id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(msg.senderId?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                isMe
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-tr-none'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'
              }`}>
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-0.5 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>{timeAgo(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {session.status !== 'closed' && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
          <input
            type="text" value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="px-3 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Mentorship() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [form, setForm] = useState({ mentorId: '', goalStatement: '' });
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    Promise.all([getMentors(), getMyMentorships()])
      .then(([mentorsRes, sessionsRes]) => {
        setMentors(mentorsRes.data.data);
        setSessions(sessionsRes.data.data);
      })
      .catch(() => toast.error('Failed to load mentorship data'))
      .finally(() => setLoading(false));
  }, []);

  const handleRequest = async () => {
    if (!form.mentorId) { toast.error('Select a mentor'); return; }
    setRequesting(true);
    try {
      const r = await requestMentor(form);
      setSessions((prev) => [r.data.data, ...prev]);
      setRequestOpen(false);
      setForm({ mentorId: '', goalStatement: '' });
      toast.success('Request sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed');
    } finally {
      setRequesting(false);
    }
  };

  const handleSend = async (id, content) => {
    const r = await sendMessage(id, content);
    setSessions((prev) => prev.map((s) => s._id === id ? r.data.data : s));
  };

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const pendingSessions = sessions.filter((s) => s.status === 'pending');
  const closedSessions = sessions.filter((s) => s.status === 'closed');

  return (
    <div className="min-h-screen bg-[var(--bg-primary,#F8FAFC)] dark:bg-slate-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Mentorship</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Connect with mentors and accelerate your learning</p>
            </div>
          </div>
          {user?.role !== 'admin' && (
            <button
              onClick={() => setRequestOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Request Mentor
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {activeSessions.length > 0 && (
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Active Sessions
                </h2>
                <div className="grid gap-4">
                  {activeSessions.map((s) => (
                    <ChatThread key={s._id} session={s} onSend={handleSend} currentUserId={user?._id} />
                  ))}
                </div>
              </div>
            )}

            {pendingSessions.length > 0 && (
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full" /> Pending Requests
                </h2>
                <div className="grid gap-4">
                  {pendingSessions.map((s) => (
                    <ChatThread key={s._id} session={s} onSend={handleSend} currentUserId={user?._id} />
                  ))}
                </div>
              </div>
            )}

            {closedSessions.length > 0 && (
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-200 mb-3 opacity-60">Closed Sessions</h2>
                <div className="grid gap-4 opacity-60">
                  {closedSessions.map((s) => (
                    <ChatThread key={s._id} session={s} onSend={handleSend} currentUserId={user?._id} />
                  ))}
                </div>
              </div>
            )}

            {sessions.length === 0 && user?.role !== 'admin' && (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No mentorship sessions yet.</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Request a mentor to get started!</p>
              </div>
            )}

            {user?.role === 'admin' && sessions.length === 0 && (
              <div className="text-center py-16">
                <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No mentorship requests yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Modal */}
      <AnimatePresence>
        {requestOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setRequestOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-0 mx-auto top-1/2 -translate-y-1/2 max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 z-50"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Request a Mentor</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Choose Mentor</label>
                  <select
                    value={form.mentorId}
                    onChange={(e) => setForm((f) => ({ ...f, mentorId: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select a mentor...</option>
                    {mentors.map((m) => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Goal Statement</label>
                  <textarea
                    value={form.goalStatement}
                    onChange={(e) => setForm((f) => ({ ...f, goalStatement: e.target.value }))}
                    placeholder="What do you want to achieve with mentorship?"
                    rows={3}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setRequestOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >Cancel</button>
                <button
                  onClick={handleRequest}
                  disabled={requesting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >{requesting ? 'Sending...' : 'Send Request'}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
