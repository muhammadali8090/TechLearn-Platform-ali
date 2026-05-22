import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, X, Search, ExternalLink, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCertificates, issueCertificate, getCourses } from '../services/instructorPanelService';
import { getAllStudents } from '../services/instructorPanelService';
import InstructorLayout from '../components/InstructorLayout';

function IssueCertModal({ onClose, onIssued, courses }) {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId);
    setSelectedStudent('');
    if (!courseId) { setStudents([]); return; }
    setLoadingStudents(true);
    try {
      const res = await getAllStudents({ courseId });
      setStudents(res.data.data.students || []);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleIssue = async () => {
    if (!selectedCourse || !selectedStudent) {
      toast.error('Please select a course and student');
      return;
    }
    setLoading(true);
    try {
      await issueCertificate(selectedCourse, selectedStudent);
      toast.success('Certificate issued successfully');
      onIssued();
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
        initial={{ opacity: 0, y: 28, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-md border border-[var(--border)] shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Issue Certificate</h3>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-indigo-400 transition-colors"
            >
              <option value="">Select a course…</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={!selectedCourse || loadingStudents}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-indigo-400 transition-colors disabled:opacity-60"
            >
              <option value="">{loadingStudents ? 'Loading…' : 'Select a student…'}</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleIssue}
            disabled={loading || !selectedCourse || !selectedStudent}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm transition-all disabled:opacity-60 hover:opacity-90"
          >
            {loading ? 'Issuing…' : 'Issue Certificate'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function InstructorCertificates() {
  const [data, setData] = useState({ certificates: [], stats: {} });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchData = () => {
    setLoading(true);
    getCertificates()
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    getCourses()
      .then((res) => setCourses(res.data.data))
      .catch(() => {});
  }, []);

  const filtered = (data.certificates || []).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.studentName?.toLowerCase().includes(q) ||
      c.courseTitle?.toLowerCase().includes(q) ||
      c.certificateId?.toLowerCase().includes(q)
    );
  });

  const stats = data.stats || {};

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Certificates</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage certificates issued across your courses</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-md shadow-amber-500/25"
          >
            <Plus className="w-4 h-4" />
            Issue Certificate
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { label: 'Total Issued', value: stats.total || 0, color: 'bg-amber-500' },
            { label: 'This Month', value: stats.thisMonth || 0, color: 'bg-emerald-500' },
            { label: 'Courses with Certs', value: (stats.byCourse || []).length, color: 'bg-indigo-500' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} flex-shrink-0`}>
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</p>
                <p className="text-sm text-[var(--text-muted)]">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* By Course breakdown */}
        {(stats.byCourse || []).length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5"
          >
            <h2 className="font-bold text-[var(--text-primary)] mb-3 text-sm">Certificates by Course</h2>
            <div className="flex flex-wrap gap-2">
              {stats.byCourse.map((c) => (
                <span key={c.courseTitle} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-semibold border border-amber-200 dark:border-amber-800/40">
                  <Award className="w-3 h-3" />
                  {c.courseTitle} · {c.count}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search certificates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-indigo-400 transition-colors"
          />
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Student</th>
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Course</th>
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Issue Date</th>
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Certificate ID</th>
                  <th className="text-center px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Verify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-5 py-3">
                        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-[var(--text-muted)]">No certificates found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((cert, i) => (
                    <motion.tr
                      key={cert._id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {cert.studentName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--text-primary)]">{cert.studentName}</p>
                            <p className="text-xs text-[var(--text-muted)]">{cert.studentEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[var(--text-primary)] font-medium">{cert.courseTitle}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(cert.issuedAt)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          {cert.certificateId ? cert.certificateId.substring(0, 16) + '…' : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {cert.certificateId && (
                          <a
                            href={`/certificate/${cert.certificateId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View
                          </a>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Issue Certificate Modal */}
      <AnimatePresence>
        {showModal && (
          <IssueCertModal
            courses={courses}
            onClose={() => setShowModal(false)}
            onIssued={fetchData}
          />
        )}
      </AnimatePresence>
    </InstructorLayout>
  );
}
