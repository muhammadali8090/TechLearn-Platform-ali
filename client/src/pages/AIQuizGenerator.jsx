import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowLeft, ChevronDown, Loader2, CheckCircle, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateAIQuiz } from '../services/aiService';
import Navbar from '../components/Navbar';

const TOPICS = [
  'JavaScript', 'Python', 'React', 'CSS', 'Node.js',
  'Databases', 'Git', 'Algorithms', 'Data Science',
  'Machine Learning', 'Cybersecurity', 'HTML',
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.4, 0, 0.2, 1] },
  }),
};

function QuestionCard({ question, index }) {
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 hover:shadow-md hover:shadow-amber-500/5 transition-shadow duration-200"
    >
      <div className="flex items-start gap-3 mb-4">
        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {index + 1}
        </span>
        <p className="font-semibold text-[var(--text-primary)] text-sm leading-relaxed">{question.question}</p>
      </div>

      <div className="space-y-2 ml-10">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctIndex;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] text-[var(--text-primary)]'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isCorrect
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
              }`}>
                {isCorrect ? <CheckCircle className="w-3.5 h-3.5" /> : letters[i]}
              </span>
              {opt}
            </div>
          );
        })}
      </div>

      {question.explanation && (
        <div className="mt-4 ml-10 px-3 py-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-0.5">Explanation</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function AIQuizGenerator() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedMeta, setGeneratedMeta] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setQuestions([]);
    try {
      const res = await generateAIQuiz(topic, difficulty, count);
      setQuestions(res.data.data.questions);
      setGeneratedMeta({ topic: res.data.data.topic, difficulty: res.data.data.difficulty });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to generate quiz';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    const text = questions
      .map((q, i) => {
        const opts = q.options.map((o, j) => `  ${String.fromCharCode(65 + j)}. ${o}${j === q.correctIndex ? ' ✓' : ''}`).join('\n');
        return `Q${i + 1}. ${q.question}\n${opts}\nExplanation: ${q.explanation || 'N/A'}`;
      })
      .join('\n\n---\n\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Quiz copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleSaveToLocalStorage = () => {
    const key = `ai_quiz_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify({ topic, difficulty, questions, createdAt: new Date().toISOString() }));
    toast.success('Quiz saved locally! You can paste it into the Lesson Builder.');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/ai" className="inline-flex items-center gap-2 text-amber-100 hover:text-white transition-colors mb-4 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to AI Hub
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white">AI Quiz Generator</h1>
              <p className="text-amber-100 mt-1">Generate professional quizzes instantly for any topic</p>
            </div>
            <div className="ml-auto hidden sm:block">
              <span className="text-xs font-semibold bg-white/20 border border-white/30 text-white px-3 py-1.5 rounded-full">
                Admin Only
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Config Panel */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 mb-8 shadow-sm"
        >
          <h2 className="font-bold text-[var(--text-primary)] mb-5 text-base">Configure your quiz</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">

            {/* Topic */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Topic</label>
              <div className="relative">
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full appearance-none bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm pr-8"
                >
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      difficulty === d
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30'
                        : 'bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)] hover:border-amber-400 hover:text-amber-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wide">
                Questions: <span className="text-amber-600 dark:text-amber-400">{count}</span>
              </label>
              <input
                type="range"
                min={5}
                max={20}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                <span>5</span><span>20</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 text-sm shadow-lg shadow-amber-500/30"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generate Quiz</>
            )}
          </button>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
              <p className="text-[var(--text-muted)]">Generating {count} questions on {topic}...</p>
            </motion.div>
          )}

          {!loading && questions.length > 0 && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Results header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {questions.length} Questions Generated
                  </h2>
                  {generatedMeta && (
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">
                      {generatedMeta.topic} • {generatedMeta.difficulty}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveToLocalStorage}
                    className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] font-medium px-4 py-2 rounded-xl hover:border-amber-400 transition-colors text-sm"
                  >
                    Copy to Course
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity text-sm"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {questions.map((q, i) => (
                  <QuestionCard key={i} question={q} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
