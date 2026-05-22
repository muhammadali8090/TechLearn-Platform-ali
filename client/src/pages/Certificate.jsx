import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, ArrowLeft, BookOpen, CheckCircle, Share2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

// Confetti particles
const CONFETTI_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316'];

function ConfettiPiece({ color, delay, x, duration }) {
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{ left: `${x}%`, top: '-20px', width: '8px', height: '12px', backgroundColor: color, borderRadius: '2px' }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ y: window.innerHeight + 40, opacity: [1, 1, 0], rotate: 360 * (Math.random() > 0.5 ? 3 : -3) }}
      transition={{ duration, delay, ease: 'easeIn' }}
    />
  );
}

// QR-like decorative SVG verification badge
function VerificationBadge({ id }) {
  const hash = id ? id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 42;
  const cells = [];
  const size = 7;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Deterministic pattern based on id hash
      const filled = ((hash * (r + 1) * (c + 3) + r * 7 + c * 11) % 3) !== 0;
      // Always fill corners for QR-like look
      const isCorner = (r < 2 && c < 2) || (r < 2 && c >= size - 2) || (r >= size - 2 && c < 2);
      cells.push({ r, c, filled: filled || isCorner });
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="70" height="70" viewBox={`0 0 ${size * 10} ${size * 10}`} className="rounded-lg">
        {cells.map(({ r, c, filled }) => (
          <rect
            key={`${r}-${c}`}
            x={c * 10 + 1}
            y={r * 10 + 1}
            width={8}
            height={8}
            rx={1}
            fill={filled ? '#6366f1' : '#e0e7ff'}
          />
        ))}
      </svg>
      <p className="text-[10px] text-slate-400 font-mono">Verification ID</p>
    </div>
  );
}

export default function Certificate() {
  const { certificateId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState([]);
  const [confettiFired, setConfettiFired] = useState(false);

  useEffect(() => {
    api.get(`/users/me/certificates/${certificateId}`)
      .then((r) => {
        setCert(r.data.data);
        // Fire confetti after a short delay
        setTimeout(() => {
          if (!confettiFired) {
            const pieces = Array.from({ length: 40 }, (_, i) => ({
              id: i,
              color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              delay: Math.random() * 0.6,
              x: Math.random() * 100,
              duration: 2 + Math.random() * 1.5,
            }));
            setConfetti(pieces);
            setConfettiFired(true);
            setTimeout(() => setConfetti([]), 4000);
          }
        }, 400);
      })
      .catch(() => toast.error('Certificate not found'))
      .finally(() => setLoading(false));
  }, [certificateId]);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const url = `${window.location.origin}/certificate/${certificateId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Certificate URL copied to clipboard!');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!cert) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-500 mb-4">Certificate not found.</p>
        <Link to="/" className="text-indigo-600 font-semibold hover:underline">Go Home</Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .certificate-container { box-shadow: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {/* Confetti */}
      {confetti.map((p) => (
        <ConfettiPiece key={p.id} color={p.color} delay={p.delay} x={p.x} duration={p.duration} />
      ))}

      <div className="min-h-screen bg-[#F8FAFC] py-10 px-4">
        {/* Actions */}
        <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between no-print flex-wrap gap-3">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleShare}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 border border-indigo-200 text-indigo-600 font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors text-sm"
            >
              <Copy className="w-4 h-4" />
              Share
            </motion.button>
            <motion.button
              onClick={handlePrint}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 text-sm shadow-md shadow-indigo-500/20"
            >
              <Download className="w-4 h-4" />
              Download / Print
            </motion.button>
          </div>
        </div>

        {/* Certificate */}
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="certificate-container bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-indigo-500">
            {/* Header accent */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-10 py-6 text-white text-center">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-extrabold tracking-wide">Learnify</span>
              </div>
              <p className="text-indigo-200 text-sm font-medium">Certificate of Completion</p>
            </div>

            {/* Body */}
            <div className="px-10 py-10 text-center">
              <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-8">
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <Award className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <p className="text-slate-500 text-lg mb-2 font-medium">This is to certify that</p>
                  <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-wide">
                    {cert.studentName}
                  </h2>
                  <p className="text-slate-500 text-lg mb-2">has successfully completed</p>
                  <h3 className="text-2xl font-bold text-indigo-600 mb-2">
                    {cert.course?.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-8">
                    {cert.course?.category} • {cert.course?.level?.charAt(0).toUpperCase() + cert.course?.level?.slice(1)} Level
                  </p>
                </motion.div>

                <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-3 inline-flex mb-8 mx-auto w-fit">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-emerald-700 font-semibold">Passed with distinction</span>
                </div>

                <div className="grid grid-cols-3 gap-6 mt-4 pt-8 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Date Issued</p>
                    <p className="font-bold text-slate-800 text-sm">
                      {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <VerificationBadge id={cert.certificateId} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Certificate ID</p>
                    <p className="font-mono text-xs text-slate-500 break-all">{cert.certificateId?.slice(-12).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* Signature line */}
              <div className="mt-8 flex justify-center">
                <div className="text-center">
                  <div className="w-32 border-b-2 border-slate-300 mb-1 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">Learnify Platform</p>
                  <p className="text-xs text-slate-400">Authorized Signature</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-10 py-4 text-center">
              <p className="text-indigo-200 text-xs">
                Verify this certificate at learnify.com/certificate/{cert.certificateId}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
