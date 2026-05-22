import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, Award, BarChart2, CheckCircle,
  TrendingUp, X, BookOpen, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCourseAnalytics, getCourseStudents, issueCertificate } from '../services/instructorPanelService';
import InstructorLayout from '../components/InstructorLayout';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className={`bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        <p className="text-sm text-[var(--text-muted)]">{label}</p>
        {sub && <p className="text-xs text-emerald-500 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// Simple SVG Bar Chart for enrollment trend
function EnrollmentChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-36 flex items-center justify-center text-[var(--text-muted)] text-sm">
        No enrollment data in last 30 days
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const chartH = 120;
  const barW = Math.max(8, Math.min(32, Math.floor(600 / data.length) - 4));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${data.length * (barW + 6)} ${chartH + 24}`}
        className="w-full"
        style={{ minWidth: Math.max(300, data.length * (barW + 6)) }}
      >
        {data.map((d, i) => {
          const barH = Math.max(4, (d.count / maxVal) * chartH);
          const x = i * (barW + 6);
          const y = chartH - barH;
          return (
            <g key={d._id}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                fill="url(#barGrad)"
                className="transition-all"
              />
              {d.count > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 3}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#6366F1"
                  fontWeight="600"
                >
                  {d.count}
                </text>
              )}
              {(i === 0 || i === data.length - 1 || data.length <= 10) && (
                <text
                  x={x + barW / 2}
                  y={chartH + 16}
                  textAnchor="middle"
                  fontSize={7}
                  fill="#94A3B8"
                >
                  {d._id?.slice(5)}
                </text>
              )}
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function IssueCertModal({ student, courseId, onClose, onIssued }) {
  const [loading, setLoading] = useState(false);

  const handleIssue = async () => {
    setLoading(true);
    try {
      await issueCertificate(courseId, student._id);
      toast.success(`Certificate issued to ${student.name}`);
      onIssued(student._id);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-sm border border-[var(--border)] shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Issue Certificate</h3>
        <p className="text-sm text-[var(--text-muted)] mb-5">
          Issue a certificate to <span className="font-semibold text-[var(--text-primary)]">{student.name}</span>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleIssue}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm transition-all disabled:opacity-60 hover:opacity-90"
          >
            {loading ? 'Issuing…' : 'Issue Certificate'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const examStatusBadge = {
  passed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  not_taken: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export default function CourseAnalytics() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [certModal, setCertModal] = useState(null);
  const [issuedCerts, setIssuedCerts] = useState(new Set());

  useEffect(() => {
    getCourseAnalytics(id)
      .then((res) => setAnalytics(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    getCourseStudents(id, { limit: 50 })
      .then((res) => setStudents(res.data.data.students))
      .catch(() => {})
      .finally(() => setStudentsLoading(false));
  }, [id]);

  const stats = analytics?.stats || {};
  const course = analytics?.course || {};

  return (
    <InstructorLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Back + header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Link
            to="/instructor/courses"
            className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-indigo-400 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {course.title || 'Course Analytics'}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">Performance overview</p>
          </div>
        </motion.div>

        {/* Hero Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Enrolled Students" value={stats.enrolledStudents || 0} color="bg-indigo-500" />
            <StatCard icon={CheckCircle} label="Completion Rate" value={`${stats.completionRate || 0}%`} color="bg-emerald-500" />
            <StatCard icon={BarChart2} label="Avg Quiz Score" value={`${stats.avgQuizScore || 0}%`} color="bg-violet-500" />
            <StatCard icon={Award} label="Exam Pass Rate" value={`${stats.examPassRate || 0}%`} color="bg-amber-500" sub={`${stats.examAttempts || 0} attempts`} />
          </div>
        )}

        {/* Enrollment Trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h2 className="font-bold text-[var(--text-primary)]">Enrollment Trend (Last 30 Days)</h2>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="h-36 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : (
              <EnrollmentChart data={analytics?.enrollmentTrend || []} />
            )}
          </div>
        </motion.div>

        {/* Lesson Completion Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
            <BookOpen className="w-4 h-4 text-violet-500" />
            <h2 className="font-bold text-[var(--text-primary)]">Lesson Completion</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Lesson</th>
                  <th className="text-right px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Completions</th>
                  <th className="text-right px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Completion%</th>
                  <th className="text-right px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Quiz Pass%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-5 py-3">
                        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : (analytics?.lessonStats || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-[var(--text-muted)]">No lesson data</td>
                  </tr>
                ) : (
                  (analytics?.lessonStats || []).map((ls, i) => (
                    <motion.tr
                      key={ls.lessonId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{ls.lessonTitle}</td>
                      <td className="px-5 py-3 text-right text-[var(--text-muted)]">{ls.views}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${ls.completionRate}%` }}
                            />
                          </div>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold w-10 text-right">{ls.completionRate}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {ls.questionCount > 0 ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{ls.quizPassRate}%</span>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Student Progress Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
            <Users className="w-4 h-4 text-indigo-500" />
            <h2 className="font-bold text-[var(--text-primary)]">Student Progress</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Student</th>
                  <th className="text-right px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Progress</th>
                  <th className="text-right px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Quiz Avg</th>
                  <th className="text-center px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Exam</th>
                  <th className="text-center px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Certificate</th>
                  <th className="text-center px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {studentsLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-5 py-3">
                        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[var(--text-muted)]">No students enrolled yet</td>
                  </tr>
                ) : (
                  students.map((student, i) => {
                    const hasCert = student.hasCertificate || issuedCerts.has(student._id);
                    return (
                      <motion.tr
                        key={student._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {student.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--text-primary)] truncate">{student.name}</p>
                              <p className="text-xs text-[var(--text-muted)] truncate">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all"
                                style={{ width: `${student.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-[var(--text-primary)] font-semibold w-10 text-right">{student.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-[var(--text-primary)]">
                          {student.avgQuizScore || 0}%
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${examStatusBadge[student.examStatus] || examStatusBadge.not_taken}`}>
                            {student.examStatus === 'not_taken' ? 'Not Taken' : student.examStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {hasCert ? (
                            <Award className="w-4 h-4 text-amber-500 mx-auto" />
                          ) : (
                            <span className="text-[var(--text-muted)] text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {!hasCert && (
                            <button
                              onClick={() => setCertModal(student)}
                              className="text-xs px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg font-semibold transition-colors"
                            >
                              Issue Cert
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Exam Stats Panel */}
        {!loading && stats.examAttempts > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-[var(--text-primary)]">Exam Statistics</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.examAttempts}</p>
                <p className="text-sm text-[var(--text-muted)]">Total Attempts</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-2xl font-bold text-emerald-500">{stats.examPassRate}%</p>
                <p className="text-sm text-[var(--text-muted)]">Pass Rate</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-2xl font-bold text-indigo-500">{stats.examAvgScore}%</p>
                <p className="text-sm text-[var(--text-muted)]">Avg Score</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Issue Certificate Modal */}
      <AnimatePresence>
        {certModal && (
          <IssueCertModal
            student={certModal}
            courseId={id}
            onClose={() => setCertModal(null)}
            onIssued={(userId) => setIssuedCerts((prev) => new Set([...prev, userId]))}
          />
        )}
      </AnimatePresence>
    </InstructorLayout>
  );
}
