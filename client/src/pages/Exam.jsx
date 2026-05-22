import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Award, CheckCircle, XCircle, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCourses, getExam, submitExam } from '../services/courseService';
import api from '../utils/api';

export default function Exam() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [course, setCourse] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      getExam(courseId),
      api.get(`/courses`),
    ]).then(([examRes, coursesRes]) => {
      setExam(examRes.data.data);
      setTimeLeft((examRes.data.data.timeLimit || 30) * 60);
      const allCourses = coursesRes.data.data || [];
      const c = allCourses.find((c) => c._id === courseId);
      if (c) setCourse(c);
    }).catch(() => {
      toast.error('Failed to load exam');
      navigate('/dashboard');
    }).finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, result]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    clearTimeout(timerRef.current);
    setSubmitting(true);
    const formattedAnswers = Object.entries(answers).map(([qi, si]) => ({
      questionIndex: parseInt(qi),
      selectedIndex: si,
    }));
    try {
      const res = await submitExam(courseId, formattedAnswers);
      setResult(res.data.data);
      if (res.data.data.passed) {
        toast.success('Congratulations! You passed!');
      } else {
        toast.error('You did not pass. Try again!');
      }
    } catch {
      toast.error('Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (result) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className={`rounded-2xl p-8 text-center mb-8 ${result.passed ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-red-50 border-2 border-red-200'}`}>
            {result.passed ? (
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            )}
            <h1 className="text-3xl font-extrabold mb-2">{result.passed ? 'Congratulations!' : 'Not Quite There'}</h1>
            <p className="text-slate-600 mb-4">
              {result.passed
                ? 'You passed the final exam and earned your certificate!'
                : `You scored ${result.score}%. You need ${result.passingScore}% to pass.`}
            </p>
            <div className="text-4xl font-extrabold text-indigo-600 mb-6">{result.score}%</div>

            {result.passed && result.certificate && (
              <div className="bg-white rounded-2xl p-6 border border-emerald-200 mb-6">
                <Award className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <p className="font-semibold text-slate-800 mb-3">Certificate Issued!</p>
                <Link
                  to={`/certificate/${result.certificate.certificateId}`}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Award className="w-4 h-4" />
                  View Certificate
                </Link>
              </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap">
              {!result.passed && (
                <button
                  onClick={() => { setResult(null); setAnswers({}); setTimeLeft((exam.timeLimit || 30) * 60); }}
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90"
                >
                  Retake Exam
                </button>
              )}
              <Link to="/dashboard" className="border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50">
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Question Review */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Question Review</h2>
            {result.questions?.map((q, i) => (
              <div key={i} className={`bg-white rounded-2xl p-5 border ${q.correct ? 'border-emerald-200' : 'border-red-200'}`}>
                <div className="flex items-start gap-3 mb-3">
                  {q.correct ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                  <p className="font-medium text-slate-800">{i + 1}. {q.question}</p>
                </div>
                <div className="space-y-1 ml-8">
                  {q.options?.map((opt, oi) => {
                    let cls = 'text-slate-600 text-sm';
                    if (oi === q.correctIndex) cls = 'text-emerald-700 text-sm font-semibold';
                    if (oi === q.userAnswer && oi !== q.correctIndex) cls = 'text-red-600 text-sm line-through';
                    return <p key={oi} className={cls}>{oi === q.correctIndex ? '✓ ' : oi === q.userAnswer ? '✗ ' : '  '}{opt}</p>;
                  })}
                </div>
                {q.explanation && (
                  <p className="mt-3 ml-8 text-sm text-slate-500 bg-slate-50 rounded-lg p-3">{q.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link to="/dashboard" className="flex items-center gap-1 text-slate-500 text-sm hover:text-slate-700 mb-1">
              <ChevronLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <h1 className="font-bold text-slate-900">Final Exam</h1>
          </div>
          <div className={`flex items-center gap-2 font-bold text-lg px-4 py-2 rounded-xl ${timeLeft !== null && timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
            <Clock className="w-5 h-5" />
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
              style={{ width: exam ? `${(Object.keys(answers).length / exam.questions.length) * 100}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{Object.keys(answers).length}/{exam?.questions?.length || 0} answered</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {exam?.questions?.map((q, qi) => (
          <div key={qi} className="bg-white rounded-2xl p-6 border border-slate-200">
            <p className="font-semibold text-slate-900 mb-4 text-lg">{qi + 1}. {q.question}</p>
            <div className="space-y-3">
              {q.options?.map((opt, oi) => (
                <label
                  key={oi}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${answers[qi] === oi ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                >
                  <input
                    type="radio"
                    name={`q-${qi}`}
                    checked={answers[qi] === oi}
                    onChange={() => setAnswers({ ...answers, [qi]: oi })}
                    className="text-indigo-500"
                  />
                  <span className="text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end pb-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold px-10 py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 text-lg"
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}
