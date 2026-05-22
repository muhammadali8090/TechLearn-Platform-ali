import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  BookOpen, ChevronDown, LayoutDashboard, LogOut, Settings, Menu, X,
  Bell, Bookmark, CheckCircle, Star, Code, Award, BookOpen as EnrollIcon,
  Trash2, GraduationCap, Sparkles, Home, Users,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import {
  getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification,
} from '../services/notificationService';

const navLinks = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/courses', label: 'Courses', icon: BookOpen, exact: false },
  { to: '/instructors', label: 'Instructors', icon: Users, exact: false },
];

const notifTypeConfig = {
  lesson_complete: { icon: CheckCircle, color: 'text-emerald-500' },
  quiz_passed: { icon: Star, color: 'text-blue-500' },
  challenge_passed: { icon: Code, color: 'text-violet-500' },
  exam_passed: { icon: Award, color: 'text-amber-500' },
  certificate_earned: { icon: Award, color: 'text-amber-500' },
  enrolled: { icon: EnrollIcon, color: 'text-indigo-500' },
  system: { icon: Bell, color: 'text-slate-500' },
};

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const roleBadgeClass = {
  admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  student: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const bellRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getNotifications();
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch {
      // silently fail
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 60000);
    return () => clearInterval(pollRef.current);
  }, [fetchNotifications]);

  const handleBellClick = () => {
    setBellOpen((v) => !v);
    setDropdownOpen(false);
  };

  const handleNotifClick = async (notif) => {
    if (!notif.read) {
      try {
        await markNotificationRead(notif._id);
        setNotifications((prev) => prev.map((n) => n._id === notif._id ? { ...n, read: true } : n));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {}
    }
    setBellOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleDeleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      const deleted = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (deleted && !deleted.read) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';

  const isLinkActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + '/');

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.94, y: -8 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, scale: 0.94, y: -8, transition: { duration: 0.15 } },
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.18, ease: 'easeIn' } },
  };

  return (
    <>
      {/* Top gradient accent line */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 z-[60]" />

      <nav
        className={`
          fixed top-0.5 left-0 right-0 z-50 transition-all duration-200
          backdrop-blur-xl bg-white/80 dark:bg-slate-900/80
          border-b border-white/20 dark:border-slate-700/40
          ${scrolled
            ? 'shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 backdrop-blur-2xl'
            : ''}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow duration-200"
              >
                <BookOpen className="w-5 h-5 text-white" />
              </motion.div>
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent font-extrabold text-xl tracking-tight">
                Learnify
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon, exact }) => {
                const active = isLinkActive(to, exact);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`
                      flex items-center gap-1.5 px-3.5 py-2 rounded-full font-medium text-sm transition-all duration-200
                      ${active
                        ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400'}
                    `}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </Link>
                );
              })}
              {user && (
                <Link
                  to="/dashboard"
                  className={`
                    flex items-center gap-1.5 px-3.5 py-2 rounded-full font-medium text-sm transition-all duration-200
                    ${isLinkActive('/dashboard', false)
                      ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400'}
                  `}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
              )}
              {user && (
                <Link
                  to="/bookmarks"
                  className={`
                    flex items-center gap-1.5 px-3.5 py-2 rounded-full font-medium text-sm transition-all duration-200
                    ${isLinkActive('/bookmarks', true)
                      ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400'}
                  `}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Bookmarks
                </Link>
              )}
              {user && (
                <Link
                  to="/ai"
                  className={`
                    flex items-center gap-1.5 px-3.5 py-2 rounded-full font-medium text-sm transition-all duration-200
                    ${isLinkActive('/ai', false)
                      ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400'}
                  `}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Features
                </Link>
              )}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />

              {user ? (
                <>
                  {/* Notifications Bell */}
                  <div className="relative" ref={bellRef}>
                    <motion.button
                      onClick={handleBellClick}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        relative p-2.5 rounded-xl transition-all duration-200
                        ${bellOpen
                          ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-violet-50 dark:hover:from-indigo-950/40 dark:hover:to-violet-950/40 hover:text-indigo-600 dark:hover:text-indigo-400'}
                      `}
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <>
                          {/* Pulse ring */}
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500/30 animate-ping" />
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center z-10"
                          >
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </motion.span>
                        </>
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {bellOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          style={{ transformOrigin: 'top right' }}
                          className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 dark:border-slate-700/50 z-50 overflow-hidden"
                        >
                          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 dark:from-indigo-950/40 dark:to-violet-950/40 border-b border-slate-100/80 dark:border-slate-700/50">
                            <div className="flex items-center gap-2">
                              <Bell className="w-4 h-4 text-indigo-500" />
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Notifications</span>
                              {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full">{unreadCount}</span>
                              )}
                            </div>
                            {unreadCount > 0 && (
                              <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                              >
                                Mark all read
                              </button>
                            )}
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="py-10 text-center">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <Bell className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                </div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No notifications yet</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">We'll notify you when something happens</p>
                              </div>
                            ) : (
                              notifications.map((notif) => {
                                const cfg = notifTypeConfig[notif.type] || notifTypeConfig.system;
                                const Icon = cfg.icon;
                                return (
                                  <div
                                    key={notif._id}
                                    onClick={() => handleNotifClick(notif)}
                                    className={`group flex items-start gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                                      !notif.read ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''
                                    }`}
                                  >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                      !notif.read ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-slate-100 dark:bg-slate-800'
                                    }`}>
                                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                        {notif.title}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{notif.message}</p>
                                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(notif.createdAt)}</p>
                                    </div>
                                    <button
                                      onClick={(e) => handleDeleteNotif(e, notif._id)}
                                      className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all duration-150 rounded flex-shrink-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* User avatar dropdown */}
                  <div className="relative">
                    <motion.button
                      onClick={() => { setDropdownOpen(!dropdownOpen); setBellOpen(false); }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-xl px-2.5 py-1.5 transition-all duration-200"
                    >
                      {/* Avatar with gradient ring + online dot */}
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-indigo-400/60 dark:ring-indigo-500/50">
                          {initials}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full" />
                      </div>
                      <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{user.name?.split(' ')[0]}</span>
                      <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          style={{ transformOrigin: 'top right' }}
                          className="absolute right-0 mt-2 w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 dark:border-slate-700/50 overflow-hidden z-50"
                        >
                          {/* Gradient header */}
                          <div className="px-4 py-4 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50 border-b border-indigo-100/60 dark:border-slate-700/50">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-indigo-400/60">
                                  {initials}
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white dark:border-slate-800 rounded-full" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{user.name}</p>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold capitalize mt-0.5 ${roleBadgeClass[user.role] || roleBadgeClass.student}`}>
                                  {user.role}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Gradient divider */}
                          <div className="h-px bg-gradient-to-r from-transparent via-indigo-200 dark:via-indigo-800 to-transparent" />

                          <div className="py-1.5">
                            <Link
                              to="/dashboard"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-150"
                            >
                              <LayoutDashboard className="w-4 h-4 opacity-70" /> Dashboard
                            </Link>
                            <Link
                              to="/bookmarks"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-150"
                            >
                              <Bookmark className="w-4 h-4 opacity-70" /> Bookmarks
                            </Link>
                            {user.role === 'admin' && (
                              <>
                                <div className="px-4 pt-2 pb-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Admin</p>
                                </div>
                                <Link
                                  to="/instructor"
                                  onClick={() => setDropdownOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-150"
                                >
                                  <GraduationCap className="w-4 h-4 opacity-70" /> Instructor Panel
                                </Link>
                                <Link
                                  to="/admin"
                                  onClick={() => setDropdownOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-150"
                                >
                                  <Settings className="w-4 h-4 opacity-70" /> Admin Panel
                                </Link>
                              </>
                            )}
                          </div>

                          <div className="h-px bg-gradient-to-r from-transparent via-red-200 dark:via-red-900/40 to-transparent" />

                          <div className="py-1.5">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-150"
                            >
                              <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 px-3 py-2"
                  >
                    Sign In
                  </Link>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      to="/auth"
                      className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition-opacity duration-200 text-sm shadow-md shadow-indigo-500/25"
                    >
                      Get Started
                    </Link>
                  </motion.div>
                </>
              )}
            </div>

            {/* Mobile: theme toggle + bell + hamburger */}
            <div className="md:hidden flex items-center gap-1.5">
              <ThemeToggle />
              {user && (
                <div className="relative">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleBellClick}
                    className="relative p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <>
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500/30 animate-ping" />
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center z-10">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      </>
                    )}
                  </motion.button>
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.span
                      key="close"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ opacity: 0, rotate: 90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: -90 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="md:hidden overflow-hidden backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-t border-white/20 dark:border-slate-700/40"
            >
              {/* User info strip (when logged in) */}
              {user && (
                <div className="px-4 py-3.5 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-indigo-100/60 dark:border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-indigo-400/60">
                        {initials}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{user.name}</p>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${roleBadgeClass[user.role] || roleBadgeClass.student}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="px-3 py-3 space-y-0.5">
                {/* Section: Learn */}
                <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Learn
                </p>
                {navLinks.map(({ to, label, icon: Icon, exact }) => {
                  const active = isLinkActive(to, exact);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors duration-150 ${
                        active
                          ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </Link>
                  );
                })}

                {user && (
                  <>
                    {/* Section: Personal */}
                    <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Personal
                    </p>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors duration-150 ${
                        isLinkActive('/dashboard', false)
                          ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link
                      to="/bookmarks"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors duration-150 ${
                        isLinkActive('/bookmarks', true)
                          ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" /> Bookmarks
                    </Link>
                    <Link
                      to="/ai"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors duration-150 ${
                        isLinkActive('/ai', false)
                          ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" /> AI Features
                    </Link>

                    {user.role === 'admin' && (
                      <>
                        {/* Section: Admin */}
                        <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Admin
                        </p>
                        <Link
                          to="/instructor"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 font-medium text-sm transition-colors duration-150"
                        >
                          <GraduationCap className="w-4 h-4" /> Instructor Panel
                        </Link>
                        <Link
                          to="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 font-medium text-sm transition-colors duration-150"
                        >
                          <Settings className="w-4 h-4" /> Admin Panel
                        </Link>
                      </>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                      <button
                        onClick={() => { handleLogout(); setMobileOpen(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium text-sm transition-colors duration-150"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}

                {!user && (
                  <div className="pt-2">
                    <Link
                      to="/auth"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm shadow-md shadow-indigo-500/25 hover:opacity-90 transition-opacity duration-200"
                    >
                      Sign In / Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Backdrop for dropdowns */}
      {(dropdownOpen || bellOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setDropdownOpen(false); setBellOpen(false); }} />
      )}

      {/* Spacer to push content below fixed navbar */}
      <div className="h-[74px]" />
    </>
  );
}
