import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Users, Award, Zap, ArrowRight, CheckCircle,
  Star, Code2, Layers, Shield, Smartphone, Brain
} from 'lucide-react';
import { getCourses } from '../services/courseService';
import { getInstructors } from '../services/userService';
import CourseCard from '../components/CourseCard';
import Navbar from '../components/Navbar';
import { useCountUp } from '../hooks/useCountUp';

/* ─── Static Data ───────────────────────────────────────────────── */

const statsData = [
  { icon: Users, label: 'Students', rawValue: 500, display: '500+' },
  { icon: BookOpen, label: 'Courses', rawValue: 20, display: '20+' },
  { icon: Zap, label: 'Always Free', rawValue: 100, display: '100%' },
  { icon: Award, label: 'Certificates', rawValue: null, display: 'Included' },
];

const features = [
  'Learn from industry experts',
  'Hands-on coding challenges',
  'Earn verified certificates',
  'No cost, no subscriptions',
  'Learn at your own pace',
  'Quiz-based assessments',
];

const testimonials = [
  {
    name: 'Alex Johnson',
    role: 'Junior Web Developer',
    quote: "Learnify's structured courses helped me land my first dev job in just 4 months. The certificates are actually valued by employers.",
    rating: 5,
    initials: 'AJ',
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    name: 'Priya Sharma',
    role: 'Data Analyst',
    quote: "The Data Science track is incredible. Free, comprehensive, and the quizzes kept me accountable. I aced my technical interview!",
    rating: 5,
    initials: 'PS',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Marcus Lee',
    role: 'Full Stack Engineer',
    quote: "I've tried Udemy and Coursera. Learnify is better structured and 100% free. The coding challenges alone are worth it.",
    rating: 5,
    initials: 'ML',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

const floatingBadges = [
  { icon: Code2, label: 'JavaScript', delay: 0, x: '5%', y: '20%' },
  { icon: Layers, label: 'React', delay: 0.8, x: '80%', y: '15%' },
  { icon: Brain, label: 'AI/ML', delay: 1.6, x: '75%', y: '65%' },
  { icon: Shield, label: 'Security', delay: 2.4, x: '10%', y: '70%' },
  { icon: Smartphone, label: 'Mobile', delay: 3.2, x: '42%', y: '80%' },
];

/* ─── Sub-components ─────────────────────────────────────────────── */

function AnimatedStat({ icon: Icon, label, rawValue, display, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const count = useCountUp(typeof rawValue === 'number' ? rawValue : 0, 1500, inView && rawValue !== null);

  const rendered = rawValue !== null
    ? (display.endsWith('+') ? `${count}+` : display.endsWith('%') ? `${count}%` : String(count))
    : display;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center py-8 px-4"
    >
      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center mb-2">
        <Icon className="w-5 h-5 text-indigo-500" />
      </div>
      <span className="text-2xl font-extrabold text-[var(--text-primary)]">{rendered}</span>
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
    </motion.div>
  );
}

function TestimonialCard({ name, role, quote, rating, initials, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-shadow duration-300 flex flex-col gap-4"
    >
      <div className="flex gap-1">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-[var(--text-muted)] text-sm leading-relaxed italic">"{quote}"</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {initials}
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] text-sm">{name}</p>
          <p className="text-xs text-[var(--text-muted)]">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  useEffect(() => {
    getCourses().then((r) => setCourses(r.data.data?.slice(0, 3) || [])).catch(() => {});
    getInstructors().then((r) => setInstructors(r.data.data?.slice(0, 3) || [])).catch(() => {});
  }, []);

  // Auto-carousel for testimonials on mobile
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIdx((i) => (i + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 text-white animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=50')] opacity-[0.07] bg-cover bg-center" />

        {/* Floating badges (desktop only) */}
        {floatingBadges.map(({ icon: Icon, label, delay, x, y }) => (
          <motion.div
            key={label}
            className="absolute hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-sm font-medium"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{
              opacity: [0, 1, 1, 0.8],
              y: [0, -8, 0, -4],
              scale: 1,
            }}
            transition={{
              opacity: { delay, duration: 0.5 },
              y: { delay, duration: 3, repeat: Infinity, ease: 'easeInOut' },
              scale: { delay, duration: 0.5 },
            }}
          >
            <Icon className="w-4 h-4 text-white/90" />
            <span className="text-white/90">{label}</span>
          </motion.div>
        ))}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              Start Learning Today — Zero Cost
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl font-extrabold leading-tight mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Code. Build.
              <br />
              <span className="text-yellow-300">Change Your Future.</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Gain real-world skills through expert-led courses, hands-on projects, and coding challenges.
              Earn a verified certificate — 100% free.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors text-lg shadow-xl shadow-black/20"
                >
                  Browse Courses
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/auth"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
                >
                  Get Started Free
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0 48L1440 48L1440 0C1200 40 960 48 720 48C480 48 240 40 0 0L0 48Z" className="fill-[var(--bg-primary)]" />
          </svg>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────── */}
      <section className="bg-[var(--bg-card)] border-b border-[var(--border)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[var(--border)]">
            {statsData.map(({ icon, label, rawValue, display }, i) => (
              <AnimatedStat
                key={label}
                icon={icon}
                label={label}
                rawValue={rawValue}
                display={display}
                delay={i * 0.08}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-4">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                succeed
              </span>
            </h2>
            <p className="text-[var(--text-muted)] text-lg mb-8 leading-relaxed">
              From beginner to advanced, our platform offers a complete learning experience with no barriers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((f, i) => (
                <motion.div
                  key={f}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm">{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl p-1 shadow-2xl shadow-indigo-500/30">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
                alt="Learning"
                className="rounded-xl w-full h-72 object-cover"
              />
            </div>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-5 -right-5 bg-[var(--bg-card)] rounded-2xl shadow-xl p-4 border border-[var(--border)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)] text-sm">Certificate Earned!</p>
                  <p className="text-xs text-[var(--text-muted)]">JavaScript Fundamentals</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Featured Courses ──────────────────────────────── */}
      <section className="py-16 bg-[var(--bg-card)] border-y border-[var(--border)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">Featured Courses</h2>
              <p className="text-[var(--text-muted)] mt-1">Start learning with our most popular courses</p>
            </motion.div>
            <Link
              to="/courses"
              className="hidden sm:flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors text-sm"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Horizontally scrollable on mobile, grid on desktop */}
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-x-visible sm:pb-0">
            {courses.map((course, i) => (
              <div key={course._id} className="min-w-[280px] sm:min-w-0 snap-start">
                <CourseCard course={course} delay={i * 0.1} />
              </div>
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link to="/courses" className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
              View all courses →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-extrabold text-[var(--text-primary)] mb-2">What Our Learners Say</h2>
          <p className="text-[var(--text-muted)]">Real results from real students</p>
        </motion.div>

        {/* Desktop: 3-col grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} {...t} delay={i * 0.1} />
          ))}
        </div>

        {/* Mobile: auto-carousel */}
        <div className="md:hidden relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIdx}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              <TestimonialCard {...testimonials[testimonialIdx]} />
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === testimonialIdx ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Instructors ───────────────────────────────────── */}
      {instructors.length > 0 && (
        <section className="py-16 bg-[var(--bg-card)] border-y border-[var(--border)] transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">Meet Our Instructors</h2>
              <p className="text-[var(--text-muted)] mt-1">Learn from industry professionals</p>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-6">
              {instructors.map((inst, i) => {
                const initials = inst.name?.split(' ').map((n) => n[0]).join('').toUpperCase();
                return (
                  <motion.div
                    key={inst._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <Link
                      to={`/instructors/${inst._id}`}
                      className="bg-[var(--bg-primary)] rounded-2xl p-6 border border-[var(--border)] shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-shadow text-center w-56 group block"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-md shadow-indigo-500/30">
                        {initials}
                      </div>
                      <h3 className="font-bold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm">
                        {inst.name}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{inst.bio}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-2">{inst.courseCount} courses</p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Section ───────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600">
        {/* Animated particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '--tx': `${(Math.random() - 0.5) * 60}px`,
              '--ty': `${-(Math.random() * 60 + 20)}px`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
            }}
          />
        ))}

        <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              Ready to start your journey?
            </h2>
            <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of learners already building their future with Learnify. Free forever.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block"
            >
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-10 py-4 rounded-xl hover:bg-indigo-50 transition-colors text-lg shadow-2xl shadow-black/20"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shadow-md">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Learnify</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/courses" className="hover:text-white transition-colors">Courses</Link>
              <Link to="/instructors" className="hover:text-white transition-colors">Instructors</Link>
              <Link to="/auth" className="hover:text-white transition-colors">Sign In</Link>
            </div>
            <p className="text-sm text-slate-500">© {new Date().getFullYear()} Learnify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
