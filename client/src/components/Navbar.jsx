import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  BookOpen, ChevronDown, LayoutDashboard, LogOut, Settings, Menu, X,
  Bell, Bookmark, CheckCircle, Star, Code, Award, BookOpen as EnrollIcon,
  Trash2, GraduationCap, Sparkles,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import {
  getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification,
} from '../services/notificationService';

const navLinks = [
  { to: '/courses', label: 'Courses' },
  { to: '/instructors', label: 'Instructors' },
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

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef(null);
  const pollRef = useRef(null);

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

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.92, y: -6 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.92, y: -6, transition: { duration: 0.15 } },
  };

  return (
    <nav className="bg-[var(--bg-card)] border-b border-[var(--border)] sticky top-0 z-50 backdrop-blur-md bg-opacity-90 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl flex-shrink-0">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/30"
            >
              <BookOpen className="w-4 h-4 text-white" />
            </motion.div>
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              Learnify
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => {
              const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
            {user && (
              <Link
                to="/bookmarks"
                className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/bookmarks'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Bookmarks
                {location.pathname === '/bookmarks' && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            )}
            {user && (
              <Link
                to="/ai"
                className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5 ${
                  location.pathname.startsWith('/ai')
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Features
                {location.pathname.startsWith('/ai') && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative" ref={bellRef}>
                  <motion.button
                    onClick={handleBellClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
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
                        className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border)] z-50 overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                          <span className="font-bold text-[var(--text-primary)] text-sm">Notifications</span>
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
                            <div className="py-8 text-center">
                              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                              <p className="text-sm text-[var(--text-muted)]">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.map((notif) => {
                              const cfg = notifTypeConfig[notif.type] || notifTypeConfig.system;
                              const Icon = cfg.icon;
                              return (
                                <div
                                  key={notif._id}
                                  onClick={() => handleNotifClick(notif)}
                                  className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                    !notif.read ? 'bg-indigo-50 dark:bg-slate-800' : ''
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                    !notif.read ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-slate-100 dark:bg-slate-700'
                                  }`}>
                                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold text-[var(--text-primary)]' : 'font-medium text-[var(--text-primary)]'}`}>
                                      {notif.title}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">{notif.message}</p>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">{timeAgo(notif.createdAt)}</p>
                                  </div>
                                  <button
                                    onClick={(e) => handleDeleteNotif(e, notif._id)}
                                    className="p-1 opacity-0 group-hover:opacity-100 hover:opacity-100 text-slate-400 hover:text-red-500 transition-colors rounded flex-shrink-0"
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
                    className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl px-3 py-2 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {initials}
                    </div>
                    <span className="font-medium text-sm text-[var(--text-primary)]">{user.name?.split(' ')[0]}</span>
                    <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
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
                        className="absolute right-0 mt-2 w-52 bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border)] py-2 z-50"
                      >
                        <div className="px-4 py-2.5 border-b border-[var(--border)]">
                          <p className="font-semibold text-[var(--text-primary)] text-sm">{user.name}</p>
                          <p className="text-xs text-[var(--text-muted)] capitalize">{user.role}</p>
                        </div>
                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link
                          to="/bookmarks"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <Bookmark className="w-4 h-4" /> Bookmarks
                        </Link>
                        {user.role === 'admin' && (
                          <>
                            <Link
                              to="/instructor"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              <GraduationCap className="w-4 h-4" /> Instructor Panel
                            </Link>
                            <Link
                              to="/admin"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              <Settings className="w-4 h-4" /> Admin Panel
                            </Link>
                          </>
                        )}
                        <div className="border-t border-[var(--border)] mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
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
                  className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/auth"
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition-opacity text-sm shadow-md shadow-indigo-500/25"
                  >
                    Get Started
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBellClick}
                  className="relative p-2 rounded-lg text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </motion.button>
              </div>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="md:hidden overflow-hidden"
            >
              <div className="border-t border-[var(--border)] py-3 space-y-1">
                {navLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-lg text-[var(--text-primary)] hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                  >
                    {label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[var(--text-primary)] hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link
                      to="/bookmarks"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[var(--text-primary)] hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                    >
                      <Bookmark className="w-4 h-4" /> Bookmarks
                    </Link>
                    <Link
                      to="/ai"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[var(--text-primary)] hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                    >
                      <Sparkles className="w-4 h-4" /> AI Features
                    </Link>
                    {user.role === 'admin' && (
                      <>
                        <Link
                          to="/instructor"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[var(--text-primary)] hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-medium transition-colors"
                        >
                          <GraduationCap className="w-4 h-4" /> Instructor Panel
                        </Link>
                        <Link
                          to="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[var(--text-primary)] hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-medium transition-colors"
                        >
                          <Settings className="w-4 h-4" /> Admin
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => { handleLogout(); setMobileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-indigo-600 dark:text-indigo-400 font-semibold"
                  >
                    Sign In / Register
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Backdrop for dropdowns */}
      {(dropdownOpen || bellOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setDropdownOpen(false); setBellOpen(false); }} />
      )}
    </nav>
  );
}
