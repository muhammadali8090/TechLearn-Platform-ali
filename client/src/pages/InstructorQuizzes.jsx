import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronUp, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
import { getQuizzes } from '../services/instructorPanelService';
import InstructorLayout from '../components/InstructorLayout';

function QuizRow({ quiz, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="border-b border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-5 py-3.5">
          <div>
            <p className="font-semibold text-[var(--text-primary)] text-sm">{quiz.lessonTitle}</p>
            <p className="text-xs text-indigo-500 mt-0.5">{quiz.courseTitle}</p>
          </div>
        </td>
        <td className="px-5 py-3.5 text-center">
          <span className="text-sm font-medium text-[var(--text-primary)]">{quiz.questionCount}</span>
        </td>
        <td className="px-5 py-3.5 text-center">
          <span className="text-sm font-medium text-[var(--text-primary)]">{quiz.attempts}</span>
        </td>
        <td className="px-5 py-3.5 text-center">
          {quiz.attempts > 0 ? (
            <span
              className={`text-sm font-bold ${
                quiz.avgScore >= 70
                  ? 'text-emerald-500'
                  : quiz.avgScore >= 50
                  ? 'text-amber-500'
                  : 'text-red-500'
              }`}
            >
              {quiz.avgScore}%
            </span>
          ) : (
            <span className="text-[var(--text-muted)] text-sm">—</span>
          )}
        </td>
        <td className="px-5 py-3.5 text-center">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
          )}
        </td>
      </motion.tr>

      {/* Expanded questions */}
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <td colSpan={5} className="px-5 pb-5 pt-1 bg-slate-50 dark:bg-slate-800/30">
              <div className="space-y-4 pt-2">
                {quiz.questions.map((q, qi) => (
                  <motion.div
                    key={qi}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: qi * 0.05 }}
                    className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4"
                  >
                    <p className="font-semibold text-[var(--text-primary)] text-sm mb-3">
                      <span className="text-[var(--text-muted)] mr-2">Q{qi + 1}.</span>
                      {q.question}
                    </p>
                    <div className="space-y-2">
                      {(q.options || []).map((opt, oi) => {
                        const isCorrect = oi === q.correctIndex;
                        return (
                          <div
                            key={oi}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)]'
                            }`}
                          >
                            {isCorrect ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                            )}
                            <span
                              className={
                                isCorrect
                                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                                  : 'text-[var(--text-muted)]'
                              }
                            >
                              {opt}
                            </span>
                            {isCorrect && (
                              <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <p className="mt-3 text-xs text-[var(--text-muted)] bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 py-2 border border-indigo-100 dark:border-indigo-800/30">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Explanation: </span>
                        {q.explanation}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

export default function InstructorQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQuizzes()
      .then((res) => setQuizzes(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalAttempts = quizzes.reduce((s, q) => s + q.attempts, 0);
  const avgScore =
    quizzes.filter((q) => q.attempts > 0).length > 0
      ? Math.round(
          quizzes.filter((q) => q.attempts > 0).reduce((s, q) => s + q.avgScore, 0) /
            quizzes.filter((q) => q.attempts > 0).length
        )
      : 0;

  return (
    <InstructorLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Quiz Manager</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {quizzes.length} quizzes across your courses
            </p>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Total Quizzes', value: quizzes.length, color: 'bg-violet-500', icon: HelpCircle },
            { label: 'Total Attempts', value: totalAttempts, color: 'bg-indigo-500', icon: BarChart2 },
            { label: 'Avg Score', value: `${avgScore}%`, color: avgScore >= 70 ? 'bg-emerald-500' : avgScore >= 50 ? 'bg-amber-500' : 'bg-red-500', icon: CheckCircle },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</p>
                  <p className="text-sm text-[var(--text-muted)]">{s.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quiz Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Lesson / Course</th>
                  <th className="text-center px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Questions</th>
                  <th className="text-center px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Attempts</th>
                  <th className="text-center px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Avg Score</th>
                  <th className="text-center px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border)]">
                      <td colSpan={5} className="px-5 py-4">
                        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : quizzes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-[var(--text-muted)]">No quizzes found in your courses</p>
                    </td>
                  </tr>
                ) : (
                  quizzes.map((quiz, i) => (
                    <QuizRow key={quiz.lessonId} quiz={quiz} index={i} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </InstructorLayout>
  );
}
