import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      className={`relative w-14 h-7 rounded-full p-0.5 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        isDark
          ? 'bg-indigo-600'
          : 'bg-slate-200'
      } ${className}`}
      whileTap={{ scale: 0.93 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Track */}
      <motion.div
        className={`absolute inset-0.5 rounded-full ${isDark ? 'bg-indigo-600' : 'bg-slate-200'}`}
        layout
      />

      {/* Thumb */}
      <motion.div
        className="relative w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center z-10"
        animate={{ x: isDark ? 28 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}
