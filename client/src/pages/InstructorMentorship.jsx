import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyMentorships, sendMessage, updateStatus } from '../services/mentorshipService';
import { useAuth } from '../hooks/useAuth';
import InstructorLayout from '../components/InstructorLayout';

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
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300' },
  active: { label: 'Active', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300' },
  closed: { label: 'Closed', color: 'text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400' },
};

function SessionCard({ session, onSend, onUpdateStatus, currentUserId }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[session.status] || statusConfig.pending;

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSend(session._id, text.trim());
      setText('');
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
              {session.studentId?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{session.studentId?.name}</p>
              <p className="text-xs text-slate-400">{timeAgo(session.createdAt)}</p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
        </div>

        {session.goalStatement && (
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2 mb-3">
            <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">Goal:</span> {session.goalStatement}</p>
          </div>
        )}

        {session.status === 'pending' && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => onUpdateStatus(session._id, 'active')}
              className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-emerald-600 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Accept
            </button>
            <button
              onClick={() => onUpdateStatus(session._id, 'closed')}
              className="flex items-center gap-1.5 border border-red-200 dark:border-red-800 text-red-500 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Decline
            </button>
          </div>
        )}

        {session.status === 'active' && (
          <button
            onClick={() => onUpdateStatus(session._id, 'closed')}
            className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors mb-3"
          >
            <XCircle className="w-3.5 h-3.5" /> Close Session
          </button>
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {expanded ? 'Hide messages' : `Messages (${session.messages?.length || 0})`}
        </button>

        {expanded && (
          <div className="mt-3 border-t border-slate-100 dark:border-slate-700 pt-3">
            <div className="h-40 overflow-y-auto space-y-2 mb-3">
              {session.messages?.length === 0 && (
                <p className="text-xs text-center text-slate-400 py-4">No messages yet</p>
              )}
              {session.messages?.map((msg) => {
                const isMe = msg.senderId?._id === currentUserId || msg.senderId === currentUserId;
                return (
                  <div key={msg._id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {(msg.senderId?.name || '?').charAt(0)}
                    </div>
                    <div className={`max-w-xs px-2.5 py-1.5 rounded-xl text-xs ${
                      isMe ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
            {session.status !== 'closed' && (
              <div className="flex gap-2">
                <input
                  type="text" value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Reply..."
                  className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !text.trim()}
                  className="px-2.5 py-1.5 bg-indigo-500 text-white rounded-xl disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InstructorMentorship() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyMentorships()
      .then((r) => setSessions(r.data.data))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async (id, content) => {
    const r = await sendMessage(id, content);
    setSessions((prev) => prev.map((s) => s._id === id ? r.data.data : s));
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const r = await updateStatus(id, status);
      setSessions((prev) => prev.map((s) => s._id === id ? r.data.data : s));
      toast.success(`Session ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const pending = sessions.filter((s) => s.status === 'pending');
  const active = sessions.filter((s) => s.status === 'active');
  const closed = sessions.filter((s) => s.status === 'closed');

  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Mentorship Requests</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your student mentorship sessions</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  Pending Requests ({pending.length})
                </h2>
                <div className="grid gap-4">
                  {pending.map((s) => (
                    <SessionCard key={s._id} session={s} onSend={handleSend} onUpdateStatus={handleUpdateStatus} currentUserId={user?._id} />
                  ))}
                </div>
              </div>
            )}
            {active.length > 0 && (
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Active Sessions ({active.length})
                </h2>
                <div className="grid gap-4">
                  {active.map((s) => (
                    <SessionCard key={s._id} session={s} onSend={handleSend} onUpdateStatus={handleUpdateStatus} currentUserId={user?._id} />
                  ))}
                </div>
              </div>
            )}
            {closed.length > 0 && (
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-200 mb-3 opacity-60">Closed Sessions</h2>
                <div className="grid gap-4 opacity-60">
                  {closed.map((s) => (
                    <SessionCard key={s._id} session={s} onSend={handleSend} onUpdateStatus={handleUpdateStatus} currentUserId={user?._id} />
                  ))}
                </div>
              </div>
            )}
            {sessions.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No mentorship requests yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </InstructorLayout>
  );
}
