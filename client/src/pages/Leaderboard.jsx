import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Flame, Crown, Medal, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLeaderboard } from '../services/leaderboardService';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const tierConfig = {
  Platinum: { color: 'from-cyan-400 to-sky-500', badge: '💎', bg: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300' },
  Gold: { color: 'from-amber-400 to-yellow-500', badge: '🥇', bg: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' },
  Silver: { color: 'from-slate-300 to-slate-400', badge: '🥈', bg: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
  Bronze: { color: 'from-orange-300 to-amber-400', badge: '🥉', bg: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' },
};

function getTier(xp) {
  if (xp >= 1000) return 'Platinum';
  if (xp >= 500) return 'Gold';
  if (xp >= 200) return 'Silver';
  return 'Bronze';
}

function RankIcon({ rank }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-orange-400" />;
  return <span className="text-sm font-bold text-slate-400 w-5 text-center">#{rank}</span>;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard({ scope: 'global' })
      .then((r) => {
        setLeaderboard(r.data.data.leaderboard || []);
        setMyRank(r.data.data.myRank);
      })
      .catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-[var(--bg-primary,#F8FAFC)] dark:bg-slate-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">Leaderboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Top 50 students ranked by XP points</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-4 mb-8">
                {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry, idx) => {
                  const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                  const tier = getTier(entry?.xp || 0);
                  const cfg = tierConfig[tier];
                  const heights = { 1: 'h-36', 2: 'h-28', 3: 'h-24' };
                  return (
                    <motion.div
                      key={entry?.userId || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${cfg.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                          {entry?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -top-1 -right-1 text-lg">{cfg.badge}</div>
                      </div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center max-w-[80px] truncate">{entry?.name}</div>
                      <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <Zap className="w-3 h-3" />{entry?.xp || 0}
                      </div>
                      <div className={`${heights[rank]} w-20 bg-gradient-to-t ${cfg.color} rounded-t-xl flex items-start justify-center pt-2`}>
                        <span className="text-white font-extrabold text-lg">#{rank}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Rest of leaderboard */}
            <div className="space-y-2 mb-4">
              {rest.map((entry, idx) => {
                const tier = getTier(entry.xp || 0);
                const cfg = tierConfig[tier];
                const isMe = entry.userId?.toString() === user?._id;
                return (
                  <motion.div
                    key={entry.userId || idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      isMe
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-sm'
                    }`}
                  >
                    <RankIcon rank={entry.rank} />
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {entry.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${isMe ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-100'}`}>
                          {entry.name}
                          {isMe && <span className="ml-1 text-xs font-normal">(you)</span>}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg}`}>{tier}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      <Zap className="w-3.5 h-3.5" />{entry.xp || 0} XP
                    </div>
                    {(entry.streakDays || 0) > 0 && (
                      <div className="flex items-center gap-1 text-xs text-orange-500">
                        <Flame className="w-3.5 h-3.5" />{entry.streakDays}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* My rank if outside top 50 */}
            {myRank && myRank > 50 && (
              <div className="mt-4 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 text-center">
                <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                  Your rank: #{myRank} — Keep earning XP to climb the leaderboard!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
