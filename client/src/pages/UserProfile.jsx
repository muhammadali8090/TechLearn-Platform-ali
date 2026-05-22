import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Globe, Zap, BookOpen, Award, Flame, Edit3, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicProfile, updateMyProfile } from '../services/profileService';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

function getTier(xp) {
  if (xp >= 1000) return { label: 'Platinum', color: 'from-cyan-400 to-sky-500' };
  if (xp >= 500) return { label: 'Gold', color: 'from-amber-400 to-yellow-500' };
  if (xp >= 200) return { label: 'Silver', color: 'from-slate-300 to-slate-500' };
  return { label: 'Bronze', color: 'from-orange-300 to-amber-400' };
}

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', website: '', github: '', skills: '', isPublic: true });
  const [saving, setSaving] = useState(false);

  const isOwn = currentUser?._id === userId;

  useEffect(() => {
    getPublicProfile(userId)
      .then((r) => {
        setProfile(r.data.data);
        if (isOwn) {
          setForm({
            name: r.data.data.name || '',
            bio: r.data.data.bio || '',
            website: r.data.data.website || '',
            github: r.data.data.github || '',
            skills: (r.data.data.skills || []).join(', '),
            isPublic: r.data.data.isPublic !== false,
          });
        }
      })
      .catch(() => toast.error('Profile not found'))
      .finally(() => setLoading(false));
  }, [userId, isOwn]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const skillsArr = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
      await updateMyProfile({ ...form, skills: skillsArr });
      await refreshUser();
      const r = await getPublicProfile(userId);
      setProfile(r.data.data);
      setEditOpen(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-primary,#F8FAFC)] dark:bg-slate-900">
      <Navbar />
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-[var(--bg-primary,#F8FAFC)] dark:bg-slate-900">
      <Navbar />
      <div className="text-center py-20"><p className="text-slate-500">Profile not found</p></div>
    </div>
  );

  const tier = getTier(profile.xp || 0);
  const initials = profile.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="min-h-screen bg-[var(--bg-primary,#F8FAFC)] dark:bg-slate-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6"
        >
          {/* Cover */}
          <div className={`h-28 bg-gradient-to-r ${tier.color} opacity-80`} />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white text-2xl font-extrabold border-4 border-white dark:border-slate-800 shadow-lg`}>
                {initials}
              </div>
              {isOwn && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{profile.name}</h1>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${tier.color} text-white`}>
                  {tier.label}
                </span>
                {profile.bio && (
                  <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm max-w-lg">{profile.bio}</p>
                )}
                <div className="flex gap-3 mt-2">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                  {profile.github && (
                    <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:underline">
                      <Github className="w-3.5 h-3.5" /> {profile.github}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: 'XP Points', value: profile.xp || 0, icon: Zap, color: 'text-indigo-500' },
            { label: 'Courses', value: profile.enrolledCourses?.length || 0, icon: BookOpen, color: 'text-blue-500' },
            { label: 'Certificates', value: profile.certificates?.length || 0, icon: Award, color: 'text-amber-500' },
            { label: 'Streak', value: `${profile.streakDays || 0}d`, icon: Flame, color: 'text-orange-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-6"
          >
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span key={skill} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm px-3 py-1 rounded-xl font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Certificates */}
        {profile.certificates?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-6"
          >
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Certificates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.certificates.map((cert) => (
                <Link
                  key={cert.certificateId}
                  to={`/certificate/${cert.certificateId}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 hover:shadow-md transition-shadow"
                >
                  <Award className="w-8 h-8 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Certificate</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Completed Courses */}
        {profile.completedCourses?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
          >
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" /> Completed Courses
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.completedCourses.map((c) => (
                <Link
                  key={c._id}
                  to={`/courses/${c.slug}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <img src={c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=60'} alt={c.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{c.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{c.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setEditOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-0 mx-auto top-1/2 -translate-y-1/2 max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Edit Profile</h2>
                <button onClick={() => setEditOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'name', label: 'Name', type: 'text' },
                  { key: 'website', label: 'Website URL', type: 'url' },
                  { key: 'github', label: 'GitHub username', type: 'text' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">{label}</label>
                    <input
                      type={type} value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Bio</label>
                  <textarea
                    value={form.bio} rows={3}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Skills (comma separated)</label>
                  <input
                    type="text" value={form.skills} placeholder="JavaScript, React, Python..."
                    onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox" checked={form.isPublic}
                    onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                    className="w-4 h-4 text-indigo-500 rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Public profile</span>
                </label>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setEditOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
