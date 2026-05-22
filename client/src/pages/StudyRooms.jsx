import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Play, Pause, RotateCcw, Coffee, Brain, X, Trash2, LogIn, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { getStudyRooms, createStudyRoom, deleteStudyRoom, joinStudyRoom, leaveStudyRoom, updateTimer } from '../services/studyRoomService';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

function PomodoroRing({ seconds, total, mode }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const progress = seconds / total;
  const offset = circ * (1 - progress);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" className="rotate-[-90deg]">
        <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={mode === 'work' ? '#6366f1' : '#10b981'}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
        <div className={`text-xs font-semibold mt-0.5 ${mode === 'work' ? 'text-indigo-500' : 'text-emerald-500'}`}>
          {mode === 'work' ? 'Focus' : 'Break'}
        </div>
      </div>
    </div>
  );
}

function RoomCard({ room, onJoin, onLeave, onDelete, currentUserId, onEnter }) {
  const isMember = room.members?.some((m) => (m._id || m) === currentUserId);
  const isCreator = (room.creatorId?._id || room.creatorId) === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{room.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Created by {room.creatorId?.name}
          </p>
        </div>
        {isCreator && (
          <button
            onClick={() => onDelete(room._id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-slate-400" />
        <div className="flex -space-x-2">
          {room.members?.slice(0, 5).map((m) => (
            <div
              key={m._id || m}
              title={m.name}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-[10px] font-bold"
            >
              {m.name?.charAt(0).toUpperCase() || '?'}
            </div>
          ))}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{room.members?.length || 0} members</span>
      </div>

      <div className="flex gap-2">
        {isMember ? (
          <>
            <button
              onClick={() => onEnter(room)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Brain className="w-4 h-4" /> Study
            </button>
            <button
              onClick={() => onLeave(room._id)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => onJoin(room._id)}
            className="flex-1 flex items-center justify-center gap-1.5 border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
          >
            <LogIn className="w-4 h-4" /> Join
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function StudyRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [localSeconds, setLocalSeconds] = useState(WORK_SECONDS);
  const timerRef = useRef(null);

  const fetchRooms = useCallback(async () => {
    try {
      const r = await getStudyRooms();
      setRooms(r.data.data);
    } catch {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Local timer tick for the active room
  useEffect(() => {
    if (!activeRoom) return;
    const ts = activeRoom.timerState;
    const total = ts.mode === 'work' ? WORK_SECONDS : BREAK_SECONDS;
    if (!ts.isPaused && ts.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(ts.startedAt)) / 1000) + (ts.elapsed || 0);
      setLocalSeconds(Math.max(0, total - elapsed));
    } else {
      setLocalSeconds(Math.max(0, total - (ts.elapsed || 0)));
    }
  }, [activeRoom]);

  useEffect(() => {
    if (!activeRoom || activeRoom.timerState?.isPaused) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setLocalSeconds((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [activeRoom?.timerState?.isPaused, activeRoom?.timerState?.startedAt]);

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    setCreating(true);
    try {
      const r = await createStudyRoom(roomName.trim());
      setRooms((prev) => [r.data.data, ...prev]);
      setRoomName('');
      setCreateOpen(false);
      toast.success('Room created!');
    } catch {
      toast.error('Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (id) => {
    try {
      const r = await joinStudyRoom(id);
      setRooms((prev) => prev.map((rm) => rm._id === id ? r.data.data : rm));
      toast.success('Joined room!');
    } catch { toast.error('Failed to join'); }
  };

  const handleLeave = async (id) => {
    try {
      await leaveStudyRoom(id);
      setRooms((prev) => prev.map((rm) => {
        if (rm._id !== id) return rm;
        return { ...rm, members: rm.members.filter((m) => (m._id || m) !== user._id) };
      }));
      if (activeRoom?._id === id) setActiveRoom(null);
    } catch { toast.error('Failed to leave'); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteStudyRoom(id);
      setRooms((prev) => prev.filter((rm) => rm._id !== id));
      if (activeRoom?._id === id) setActiveRoom(null);
      toast.success('Room closed');
    } catch { toast.error('Failed to delete'); }
  };

  const handleTimer = async (action) => {
    try {
      const r = await updateTimer(activeRoom._id, action);
      setActiveRoom(r.data.data);
    } catch { toast.error('Timer update failed'); }
  };

  const mode = activeRoom?.timerState?.mode || 'work';
  const totalSeconds = mode === 'work' ? WORK_SECONDS : BREAK_SECONDS;
  const isPaused = activeRoom?.timerState?.isPaused !== false;

  return (
    <div className="min-h-screen bg-[var(--bg-primary,#F8FAFC)] dark:bg-slate-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">Study Rooms</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Study together with Pomodoro focus sessions</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Create Room
          </motion.button>
        </div>

        {/* Active Room Panel */}
        <AnimatePresence>
          {activeRoom && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-indigo-200 dark:border-indigo-800 p-8 mb-8 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{activeRoom.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{activeRoom.members?.length} members studying</p>
                </div>
                <button
                  onClick={() => setActiveRoom(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex flex-col items-center gap-4">
                  <PomodoroRing seconds={localSeconds} total={totalSeconds} mode={mode} />
                  <div className="flex items-center gap-2">
                    {isPaused ? (
                      <button
                        onClick={() => handleTimer('start')}
                        className="flex items-center gap-2 bg-indigo-500 text-white px-5 py-2 rounded-xl font-semibold hover:bg-indigo-600 transition-colors"
                      >
                        <Play className="w-4 h-4" /> Start
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTimer('pause')}
                        className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2 rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                      >
                        <Pause className="w-4 h-4" /> Pause
                      </button>
                    )}
                    <button
                      onClick={() => handleTimer('reset')}
                      className="p-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTimer('switchMode')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                        mode === 'work'
                          ? 'border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                          : 'border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                      }`}
                    >
                      {mode === 'work' ? <><Coffee className="w-3.5 h-3.5" /> Break</> : <><Brain className="w-3.5 h-3.5" /> Focus</>}
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-sm">Members</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {activeRoom.members?.map((m) => (
                      <div key={m._id || m} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-700">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {m.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Room Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No active rooms. Create one to start studying!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                currentUserId={user?._id}
                onJoin={handleJoin}
                onLeave={handleLeave}
                onDelete={handleDelete}
                onEnter={setActiveRoom}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
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
              className="fixed inset-x-0 mx-auto bottom-0 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 max-w-md bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 z-50"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Create Study Room</h2>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name (e.g. React Study Group)"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !roomName.trim()}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
