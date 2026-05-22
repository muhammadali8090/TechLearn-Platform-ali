import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Map, MessageCircle, Zap, BarChart2, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

const features = [
  {
    icon: Target,
    title: 'Smart Recommendations',
    description: 'Get personalized course picks based on your learning history, skills, and goals. Our AI ranks courses by relevance, skill level, and diversity.',
    link: '/ai/recommendations',
    gradient: 'from-indigo-500 to-blue-500',
    glow: 'shadow-indigo-500/30',
    adminOnly: false,
  },
  {
    icon: Map,
    title: 'Learning Roadmap',
    description: 'Enter your career goal and get a structured 4–6 step roadmap with estimated timelines, required skills, and curated course suggestions.',
    link: '/ai/roadmap',
    gradient: 'from-violet-500 to-purple-500',
    glow: 'shadow-violet-500/30',
    adminOnly: false,
  },
  {
    icon: MessageCircle,
    title: 'Study Assistant',
    description: 'Chat with your AI study companion anytime. Get context-aware explanations, study tips, quiz prep advice, and course-specific guidance.',
    link: '/ai/chat',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/30',
    adminOnly: false,
  },
  {
    icon: Zap,
    title: 'Quiz Generator',
    description: 'Instantly generate quizzes on any supported topic. Choose difficulty and question count. Perfect for creating assessments for your courses.',
    link: '/ai/quiz-generator',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/30',
    adminOnly: true,
  },
  {
    icon: BarChart2,
    title: 'Skill Tracker',
    description: 'Visualize your skill growth across all learning categories. Track trends, see your strongest skills, and identify areas for improvement.',
    link: '/ai/skills',
    gradient: 'from-pink-500 to-rose-500',
    glow: 'shadow-pink-500/30',
    adminOnly: false,
  },
];

export default function AIHub() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-slate-950 dark:bg-slate-950">
        {/* Animated gradient orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* AI Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/40 rounded-full px-4 py-2 mb-6"
            >
              <motion.span
                animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </motion.span>
              <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                AI-Powered Learning
              </span>
              <span className="text-xs text-indigo-400/70 bg-indigo-500/20 px-2 py-0.5 rounded-full">NEW</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 leading-tight">
              Your Personal{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                AI Learning Hub
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Intelligent tools that adapt to your learning style. Get personalized recommendations,
              custom roadmaps, and real-time study assistance — all without leaving Learnify.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/ai/chat"
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/30"
              >
                <MessageCircle className="w-4 h-4" /> Start Chatting
              </Link>
              <Link
                to="/ai/recommendations"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <Target className="w-4 h-4" /> Get Recommendations
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-extrabold text-[var(--text-primary)] mb-3">
            Explore AI Features
          </h2>
          <p className="text-[var(--text-muted)] max-w-xl mx-auto">
            Five powerful AI tools designed to accelerate your learning journey on Learnify.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            if (feature.adminOnly && user?.role !== 'admin') return null;
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:shadow-xl"
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />

                {/* Admin badge */}
                {feature.adminOnly && (
                  <span className="absolute top-4 right-4 text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    Admin Only
                  </span>
                )}

                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg ${feature.glow} shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{feature.title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6">{feature.description}</p>

                <Link
                  to={feature.link}
                  className={`flex items-center justify-center gap-2 w-full bg-gradient-to-r ${feature.gradient} text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm`}
                >
                  Launch <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-purple-600/10 border-y border-[var(--border)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          >
            {[
              { value: '5', label: 'AI Features' },
              { value: '30+', label: 'Quiz Topics' },
              { value: '5', label: 'Roadmap Paths' },
              { value: '∞', label: 'Study Chats' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">{value}</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
