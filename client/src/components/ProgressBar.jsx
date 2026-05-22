import { motion } from 'framer-motion';

export default function ProgressBar({ value = 0, className = '', showLabel = false, height = 'h-2' }) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full ${height} overflow-hidden`}>
        <motion.div
          className={`${height} bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      {showLabel && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-[var(--text-muted)]">{clamped}% complete</span>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{clamped}%</span>
        </div>
      )}
    </div>
  );
}
