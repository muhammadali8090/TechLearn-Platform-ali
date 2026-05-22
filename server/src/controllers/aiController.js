import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function deriveSkillLevel(score) {
  if (score >= 90) return 'Expert';
  if (score >= 70) return 'Advanced';
  if (score >= 40) return 'Intermediate';
  return 'Beginner';
}

function computeTrend(scores) {
  if (scores.length < 2) return 'stable';
  const recent = scores.slice(-3);
  const older = scores.slice(-6, -3);
  if (older.length === 0) return 'stable';
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  if (recentAvg - olderAvg > 5) return 'improving';
  if (olderAvg - recentAvg > 5) return 'declining';
  return 'stable';
}

// ─── GET /api/ai/recommendations ────────────────────────────────────────────

export const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const enrolledIds = user.enrolledCourses.map((e) => e.courseId.toString());

    const progresses = await Progress.find({ user: userId }).populate('course');

    // Count categories from enrolled courses
    const categoryCount = {};
    for (const p of progresses) {
      const cat = p.course?.category;
      if (cat) categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }

    // Determine top category and tags
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const userTags = new Set();
    for (const p of progresses) {
      (p.course?.tags || []).forEach((t) => userTags.add(t.toLowerCase()));
    }

    // Compute avg level from enrolled courses
    const levelOrder = { beginner: 0, intermediate: 1, advanced: 2 };
    const levels = progresses.map((p) => levelOrder[p.course?.level] ?? 0);
    const avgLevel = levels.length ? Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) : 0;
    const targetLevels = Object.keys(levelOrder).filter((k) => levelOrder[k] >= avgLevel);

    // Get all published courses not enrolled
    const allCourses = await Course.find({
      status: 'published',
      _id: { $nin: enrolledIds },
    }).limit(50);

    // Score each course
    const scored = allCourses.map((course) => {
      let score = 0;
      if (course.category === topCategory) score += 3;
      (course.tags || []).forEach((t) => {
        if (userTags.has(t.toLowerCase())) score += 1;
      });
      if (targetLevels.includes(course.level)) score += 2;
      score += Math.min(course.enrolledCount || 0, 100) * 0.01;

      // Diversity bonus for underrepresented categories
      if (!categoryCount[course.category]) score += 1.5;

      return { course, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 6);

    const maxScore = top[0]?.score || 1;
    const courses = top.map(({ course, score }) => ({
      _id: course._id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnail: course.thumbnail,
      category: course.category,
      level: course.level,
      tags: course.tags,
      enrolledCount: course.enrolledCount,
      aiScore: Math.round((score / maxScore) * 100),
    }));

    const reasoning = topCategory
      ? `Based on your interest in ${topCategory} and ${userTags.size} skill tags, these courses align with your learning trajectory.`
      : 'Curated popular courses across diverse topics to help you get started on your learning journey.';

    res.json({ success: true, data: { courses, reasoning } });
  } catch (err) {
    next(err);
  }
};

// ─── Roadmap templates ────────────────────────────────────────────────────────

const roadmapTemplates = {
  webDev: {
    title: 'Full-Stack Web Developer',
    steps: [
      { step: 1, title: 'HTML & CSS Foundations', description: 'Learn semantic HTML5 and modern CSS including flexbox, grid, and responsive design.', skills: ['HTML', 'CSS', 'Responsive Design'], estimatedWeeks: 2, categoryHints: ['Web Dev'], tagHints: ['html', 'css'] },
      { step: 2, title: 'JavaScript Essentials', description: 'Master JavaScript fundamentals: variables, functions, DOM, events, and ES6+ features.', skills: ['JavaScript', 'DOM', 'ES6'], estimatedWeeks: 3, categoryHints: ['Web Dev'], tagHints: ['javascript', 'es6'] },
      { step: 3, title: 'React Frontend Development', description: 'Build dynamic UIs with React, hooks, state management, and React Router.', skills: ['React', 'JSX', 'Hooks'], estimatedWeeks: 4, categoryHints: ['Web Dev'], tagHints: ['react', 'frontend'] },
      { step: 4, title: 'Node.js & Express Backend', description: 'Create RESTful APIs with Node.js and Express, handle authentication and middleware.', skills: ['Node.js', 'Express', 'REST API'], estimatedWeeks: 3, categoryHints: ['Web Dev', 'Backend'], tagHints: ['nodejs', 'backend'] },
      { step: 5, title: 'Databases & Deployment', description: 'Work with SQL/NoSQL databases and deploy full-stack apps to the cloud.', skills: ['MongoDB', 'SQL', 'Docker'], estimatedWeeks: 2, categoryHints: ['Databases'], tagHints: ['database', 'mongodb'] },
    ],
    totalWeeks: 14,
  },
  dataScience: {
    title: 'Data Scientist',
    steps: [
      { step: 1, title: 'Python for Data Science', description: 'Learn Python with NumPy, Pandas, and data manipulation fundamentals.', skills: ['Python', 'NumPy', 'Pandas'], estimatedWeeks: 3, categoryHints: ['Data Science'], tagHints: ['python', 'pandas'] },
      { step: 2, title: 'Data Visualization', description: 'Create compelling visualizations with Matplotlib, Seaborn, and Plotly.', skills: ['Matplotlib', 'Seaborn', 'Plotly'], estimatedWeeks: 2, categoryHints: ['Data Science'], tagHints: ['visualization', 'matplotlib'] },
      { step: 3, title: 'Statistics & Probability', description: 'Understand statistical foundations: distributions, hypothesis testing, and regression.', skills: ['Statistics', 'Probability', 'Regression'], estimatedWeeks: 3, categoryHints: ['Data Science', 'Math'], tagHints: ['statistics', 'probability'] },
      { step: 4, title: 'Machine Learning with Scikit-learn', description: 'Build supervised and unsupervised ML models, evaluate and tune performance.', skills: ['Scikit-learn', 'ML Models', 'Feature Engineering'], estimatedWeeks: 4, categoryHints: ['Data Science', 'Machine Learning'], tagHints: ['machine learning', 'scikit-learn'] },
      { step: 5, title: 'Deep Learning & Neural Networks', description: 'Explore TensorFlow/PyTorch for deep learning, CNNs, and NLP basics.', skills: ['TensorFlow', 'PyTorch', 'Neural Networks'], estimatedWeeks: 4, categoryHints: ['Machine Learning', 'AI'], tagHints: ['deep learning', 'tensorflow'] },
    ],
    totalWeeks: 16,
  },
  mobile: {
    title: 'Mobile App Developer',
    steps: [
      { step: 1, title: 'JavaScript & TypeScript Basics', description: 'Strengthen your JavaScript fundamentals and learn TypeScript for typed development.', skills: ['JavaScript', 'TypeScript'], estimatedWeeks: 2, categoryHints: ['Web Dev'], tagHints: ['javascript', 'typescript'] },
      { step: 2, title: 'React Native Fundamentals', description: 'Build cross-platform mobile apps with React Native components and navigation.', skills: ['React Native', 'Expo', 'Mobile UI'], estimatedWeeks: 4, categoryHints: ['Mobile'], tagHints: ['react native', 'mobile'] },
      { step: 3, title: 'State Management & APIs', description: 'Manage app state with Redux/Context and integrate REST/GraphQL APIs.', skills: ['Redux', 'API Integration', 'GraphQL'], estimatedWeeks: 3, categoryHints: ['Mobile', 'Web Dev'], tagHints: ['redux', 'api'] },
      { step: 4, title: 'Native Features & Performance', description: 'Access device features like camera, GPS, and push notifications. Optimize performance.', skills: ['Device APIs', 'Performance', 'Push Notifications'], estimatedWeeks: 2, categoryHints: ['Mobile'], tagHints: ['native', 'performance'] },
      { step: 5, title: 'Publishing & Monetization', description: 'Deploy to App Store and Google Play. Learn ASO and monetization strategies.', skills: ['App Store Optimization', 'In-App Purchases'], estimatedWeeks: 1, categoryHints: ['Mobile'], tagHints: ['publishing'] },
    ],
    totalWeeks: 12,
  },
  aiMl: {
    title: 'AI/ML Engineer',
    steps: [
      { step: 1, title: 'Python & Math Foundations', description: 'Python programming, linear algebra, calculus, and statistics for ML.', skills: ['Python', 'Linear Algebra', 'Calculus'], estimatedWeeks: 3, categoryHints: ['Data Science', 'Math'], tagHints: ['python', 'math'] },
      { step: 2, title: 'Classical Machine Learning', description: 'Supervised/unsupervised algorithms, model evaluation, and feature engineering.', skills: ['Regression', 'Classification', 'Clustering'], estimatedWeeks: 4, categoryHints: ['Machine Learning', 'Data Science'], tagHints: ['machine learning', 'scikit-learn'] },
      { step: 3, title: 'Deep Learning', description: 'Neural networks, CNNs, RNNs, and transformer architectures with PyTorch.', skills: ['Neural Networks', 'CNNs', 'Transformers'], estimatedWeeks: 5, categoryHints: ['Machine Learning', 'AI'], tagHints: ['deep learning', 'pytorch'] },
      { step: 4, title: 'NLP & Computer Vision', description: 'Natural language processing and computer vision applications.', skills: ['NLP', 'Computer Vision', 'BERT'], estimatedWeeks: 4, categoryHints: ['AI', 'Machine Learning'], tagHints: ['nlp', 'computer vision'] },
      { step: 5, title: 'MLOps & Deployment', description: 'Deploy models with FastAPI, Docker, and cloud platforms. Monitor model drift.', skills: ['MLOps', 'Docker', 'FastAPI'], estimatedWeeks: 3, categoryHints: ['DevOps', 'AI'], tagHints: ['mlops', 'deployment'] },
    ],
    totalWeeks: 19,
  },
  cybersecurity: {
    title: 'Cybersecurity Professional',
    steps: [
      { step: 1, title: 'Networking Fundamentals', description: 'TCP/IP, DNS, HTTP protocols, firewalls, and network architecture basics.', skills: ['TCP/IP', 'DNS', 'Firewalls'], estimatedWeeks: 2, categoryHints: ['Networking', 'Cybersecurity'], tagHints: ['networking', 'tcp/ip'] },
      { step: 2, title: 'Linux & Command Line', description: 'Linux administration, bash scripting, permissions, and system management.', skills: ['Linux', 'Bash', 'CLI'], estimatedWeeks: 2, categoryHints: ['Cybersecurity', 'DevOps'], tagHints: ['linux', 'bash'] },
      { step: 3, title: 'Security Fundamentals', description: 'CIA triad, threat modeling, vulnerability assessment, and security policies.', skills: ['Threat Modeling', 'Risk Assessment', 'CIA Triad'], estimatedWeeks: 3, categoryHints: ['Cybersecurity'], tagHints: ['security', 'threats'] },
      { step: 4, title: 'Ethical Hacking & Pen Testing', description: 'Penetration testing methodology, Kali Linux, OWASP Top 10, and exploit techniques.', skills: ['Ethical Hacking', 'OWASP', 'Kali Linux'], estimatedWeeks: 4, categoryHints: ['Cybersecurity'], tagHints: ['hacking', 'penetration testing'] },
      { step: 5, title: 'Incident Response & Forensics', description: 'Digital forensics, SIEM, log analysis, and incident response playbooks.', skills: ['Digital Forensics', 'SIEM', 'Incident Response'], estimatedWeeks: 3, categoryHints: ['Cybersecurity'], tagHints: ['forensics', 'incident response'] },
    ],
    totalWeeks: 14,
  },
};

function detectTemplate(goal) {
  const g = (goal || '').toLowerCase();
  if (/web|frontend|full.?stack|html|css|react/.test(g)) return 'webDev';
  if (/data sci|data scientist|analytics/.test(g)) return 'dataScience';
  if (/mobile|android|ios|app dev/.test(g)) return 'mobile';
  if (/\bai\b|machine learning|deep learning|neural/.test(g)) return 'aiMl';
  if (/cyber|security|hacking|pen test/.test(g)) return 'cybersecurity';
  return 'webDev'; // default fallback
}

export const getRoadmap = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const goal = req.query.goal || 'become a full-stack developer';
    const templateKey = detectTemplate(goal);
    const template = roadmapTemplates[templateKey];

    // Determine current step from user's progress
    const progresses = await Progress.find({ user: userId }).populate('course');
    const userCategories = new Set(progresses.map((p) => p.course?.category).filter(Boolean));
    const userTags = new Set();
    progresses.forEach((p) => (p.course?.tags || []).forEach((t) => userTags.add(t.toLowerCase())));

    let currentStep = 1;
    for (const step of template.steps) {
      const catMatch = step.categoryHints.some((c) => userCategories.has(c));
      const tagMatch = step.tagHints.some((t) => userTags.has(t));
      if (catMatch || tagMatch) currentStep = step.step + 1;
    }
    currentStep = Math.min(currentStep, template.steps.length);

    // Populate suggestedCourses for each step
    const stepsWithCourses = await Promise.all(
      template.steps.map(async (step) => {
        const courses = await Course.find({
          status: 'published',
          $or: [
            { category: { $in: step.categoryHints } },
            { tags: { $in: step.tagHints } },
          ],
        })
          .limit(3)
          .select('_id title slug category level thumbnail');

        return {
          ...step,
          suggestedCourses: courses.map((c) => ({
            _id: c._id,
            title: c.title,
            slug: c.slug,
            category: c.category,
            level: c.level,
            thumbnail: c.thumbnail,
          })),
        };
      })
    );

    res.json({
      success: true,
      data: {
        goal,
        roadmapTitle: template.title,
        steps: stepsWithCourses,
        totalWeeks: template.totalWeeks,
        currentStep,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────

const GREETING_RE = /\b(hi|hello|hey|howdy|sup|greetings|good morning|good afternoon|good evening)\b/i;
const HELP_RE = /\b(help|stuck|don'?t understand|confused|lost)\b/i;
const EXPLAIN_RE = /\b(explain|what is|what are|how does|how do|tell me about|describe|define)\b/i;
const QUIZ_RE = /\b(quiz|exam|test|assessment|grade|score)\b/i;
const PROGRESS_RE = /\b(progress|complete|finished|how far|percentage)\b/i;
const CODE_RE = /\b(code|error|bug|debug|syntax|function|variable|loop|array)\b/i;
const CERT_RE = /\b(certificate|certification|badge|credential)\b/i;
const DEADLINE_RE = /\b(deadline|due|time|how long|duration|finish|when)\b/i;
const TIPS_RE = /\b(tips?|advice|recommend|suggestion|best way|strategy)\b/i;

function buildSuggestions(context) {
  const base = [
    'How can I improve my quiz scores?',
    'What should I study next?',
    'Can you explain this concept in simpler terms?',
  ];
  if (context?.courseId) {
    return [
      'What are the key topics in this course?',
      'How do I earn the certificate?',
      'Where can I practice these skills?',
    ];
  }
  return base;
}

export const chat = async (req, res, next) => {
  try {
    const { message, context } = req.body;
    const msg = (message || '').trim();

    if (!msg) {
      return res.status(400).json({ success: false, error: 'Message is required', statusCode: 400 });
    }

    let reply = '';
    let suggestions = buildSuggestions(context);

    // Fetch course context if provided
    let courseData = null;
    if (context?.courseId) {
      courseData = await Course.findById(context.courseId).select('title category description tags level');
    }

    const coursePrefix = courseData
      ? `Regarding **${courseData.title}** (${courseData.category}, ${courseData.level} level): `
      : '';

    if (GREETING_RE.test(msg)) {
      reply = `Hello! 👋 I'm your AI study assistant on Learnify. ${courseData ? `I see you're working on **${courseData.title}** — great choice! ` : ''}I can help you with course questions, study tips, quiz prep, and more. What would you like to know?`;
      suggestions = [
        'How do I track my progress?',
        'What courses do you recommend for me?',
        'Give me a study tip',
      ];
    } else if (CERT_RE.test(msg)) {
      reply = `${coursePrefix}To earn a certificate, you need to complete all lessons in the course and pass the final exam with a score of **70% or higher**. Once you pass, your certificate is automatically generated and available in your Dashboard under the Certificates section. You can share it directly or download a PDF copy.`;
      suggestions = ['How long is the final exam?', 'Can I retake the exam?', 'How do I view my certificate?'];
    } else if (QUIZ_RE.test(msg)) {
      reply = `${coursePrefix}Each lesson has a short quiz to reinforce the concepts. Here are some tips: \n\n• **Re-read the lesson summary** before attempting the quiz.\n• **Take notes** on key terms — these often appear as questions.\n• If you score below 70%, review the lesson video and try again.\n• Quizzes count toward your overall progress percentage.`;
      suggestions = ['How many questions are in each quiz?', 'Do quiz scores affect my certificate?', 'What happens if I fail a quiz?'];
    } else if (PROGRESS_RE.test(msg)) {
      reply = `${coursePrefix}Your progress is tracked automatically as you complete lessons and quizzes. You can view your overall progress percentage on your **Dashboard** and on each course card. The progress bar shows completed lessons out of total lessons. Keep completing lessons to reach 100%!`;
      suggestions = ['How do I complete a lesson?', 'Can I mark lessons as done manually?', 'Show me my skill stats'];
    } else if (CODE_RE.test(msg)) {
      const lessonHint = context?.lessonTitle ? ` in the "${context.lessonTitle}" lesson` : '';
      reply = `${coursePrefix}For coding challenges${lessonHint}, here's my advice:\n\n• **Read the problem statement carefully** — identify inputs and expected outputs.\n• **Break it down** into smaller sub-problems before writing code.\n• Use **console.log()** or print statements to debug step by step.\n• Check for off-by-one errors in loops and ensure your return statement is correct.\n• If stuck, revisit the lesson video — the solution pattern is often demonstrated there.`;
      suggestions = ['What is a common JavaScript bug?', 'How do I debug async code?', 'Explain functions with an example'];
    } else if (EXPLAIN_RE.test(msg)) {
      const topic = msg.replace(EXPLAIN_RE, '').replace(/[?.!]/g, '').trim();
      reply = `${coursePrefix}Great question! ${topic ? `Let me break down **${topic}**: ` : ''}Learning complex topics is easiest when you connect new concepts to things you already know. Try to:\n\n1. Read the concept once quickly (overview)\n2. Read it again slowly, taking notes\n3. Explain it back to yourself in your own words (Feynman technique)\n4. Apply it in a small exercise\n\nIf you share more specifics about what you're trying to understand, I can give you a more targeted explanation!`;
      suggestions = ['Can you give me an example?', 'What are common mistakes with this?', 'How does this relate to other concepts?'];
    } else if (HELP_RE.test(msg)) {
      reply = `${coursePrefix}No worries — getting stuck is a normal part of learning! Here's what I suggest:\n\n1. **Rewatch the lesson video** — sometimes a second viewing makes things click.\n2. **Check the lesson resources** — there may be a cheat sheet or reference link.\n3. **Break the problem down** — identify exactly which part is confusing.\n4. **Search for examples** online using specific keywords from the lesson.\n5. **Come back later** — sometimes a fresh perspective after a break helps!\n\nWhat specifically are you stuck on?`;
      suggestions = ['Where can I find extra resources?', 'Is there a simpler explanation?', 'What prerequisites should I know?'];
    } else if (DEADLINE_RE.test(msg)) {
      reply = `${coursePrefix}Courses on Learnify are **self-paced** with no strict deadlines. Take your time! That said, here's a rough guide:\n\n• **Beginner courses**: 2–4 weeks at 1 hour/day\n• **Intermediate courses**: 4–6 weeks at 1 hour/day\n• **Advanced courses**: 6–10 weeks at 1 hour/day\n\nUse the **Weekly Goal** feature on your Dashboard to set a target number of lessons per week and track your pace.`;
      suggestions = ['How do I set weekly goals?', 'How many lessons are in a typical course?', 'Can I learn faster?'];
    } else if (TIPS_RE.test(msg)) {
      reply = `${coursePrefix}Here are my top study strategies for online learning:\n\n🎯 **Active Recall** — Test yourself after each lesson instead of just re-reading.\n⏱️ **Pomodoro Technique** — Study for 25 minutes, break for 5. Repeat 4 times.\n📓 **Note-Taking** — Write key concepts in your own words.\n🔗 **Spaced Repetition** — Review past material at increasing intervals.\n💪 **Consistent Schedule** — Even 30 minutes daily beats a 4-hour weekend cram.\n🤝 **Teach Others** — Explaining concepts solidifies your own understanding.`;
      suggestions = ['How do I stay motivated?', 'What is the best time to study?', 'How do I avoid burnout?'];
    } else {
      // Generic fallback with study tip
      const studyTips = [
        'Try the **Feynman Technique**: explain the concept you just learned in simple terms as if teaching a child. It reveals gaps in your understanding.',
        'Use **active recall** instead of passive re-reading. Close your notes and try to write down everything you remember — it boosts retention by 50%.',
        'Apply the **80/20 rule**: focus on the 20% of concepts that appear in 80% of problems. In programming, that means mastering fundamentals before advanced topics.',
        'Take **regular breaks** using the Pomodoro technique. Your brain consolidates learning during rest periods.',
        'Connect new concepts to what you already know. Building a **mental model** helps information stick.',
      ];
      const tip = studyTips[Math.floor(Math.random() * studyTips.length)];
      reply = `${coursePrefix}That's an interesting question! Here's something that might help:\n\n${tip}\n\nFeel free to ask me about specific course content, quiz tips, or how to use any Learnify feature!`;
    }

    res.json({ success: true, data: { reply, suggestions } });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ai/generate-quiz ───────────────────────────────────────────────

const QUESTION_BANK = {
  JavaScript: [
    { question: 'What does `typeof null` return in JavaScript?', options: ['"null"', '"undefined"', '"object"', '"boolean"'], correctIndex: 2, explanation: 'This is a historical bug in JavaScript — typeof null returns "object".' },
    { question: 'Which method removes the last element from an array?', options: ['shift()', 'pop()', 'splice()', 'delete()'], correctIndex: 1, explanation: 'Array.pop() removes and returns the last element.' },
    { question: 'What is a closure in JavaScript?', options: ['A self-executing function', 'A function with access to its outer scope variables', 'An error handling mechanism', 'A type of loop'], correctIndex: 1, explanation: 'A closure is a function that retains access to variables from its outer scope.' },
    { question: 'What does the spread operator (...) do?', options: ['Creates a promise', 'Spreads array/object elements', 'Declares a generator', 'Deletes a variable'], correctIndex: 1, explanation: 'The spread operator expands iterables into individual elements.' },
    { question: 'Which ES6 feature allows destructuring of objects?', options: ['Arrow functions', 'Template literals', 'Destructuring assignment', 'Default parameters'], correctIndex: 2, explanation: 'Destructuring assignment allows unpacking values from arrays or properties from objects.' },
    { question: 'What is the difference between == and ===?', options: ['No difference', '=== also checks type', '== also checks type', '=== is slower'], correctIndex: 1, explanation: '=== (strict equality) checks both value and type, while == performs type coercion.' },
    { question: 'What does Promise.all() do?', options: ['Runs promises sequentially', 'Returns the first resolved promise', 'Runs all promises in parallel and resolves when all complete', 'Ignores rejected promises'], correctIndex: 2, explanation: 'Promise.all() takes an array of promises and resolves when all of them resolve.' },
    { question: 'What is event bubbling?', options: ['An event that creates new events', 'When an event propagates from child to parent elements', 'A DOM loading event', 'A scroll animation'], correctIndex: 1, explanation: 'Event bubbling means an event triggered on a nested element propagates upward through its ancestors.' },
  ],
  Python: [
    { question: 'What does the `len()` function do in Python?', options: ['Returns the largest element', 'Returns the number of items in an object', 'Converts to a list', 'Checks if empty'], correctIndex: 1, explanation: 'len() returns the number of items in an object like a list, string, or dict.' },
    { question: 'What is a list comprehension?', options: ['A way to document lists', 'A concise way to create lists from iterables', 'A type of sorting algorithm', 'A method to merge lists'], correctIndex: 1, explanation: 'List comprehensions provide a concise way to create lists: [expr for item in iterable if condition].' },
    { question: 'What is the difference between a list and a tuple in Python?', options: ['Lists are faster', 'Tuples are mutable, lists are not', 'Lists are mutable, tuples are not', 'No difference'], correctIndex: 2, explanation: 'Lists are mutable (can be changed), while tuples are immutable (cannot be changed after creation).' },
    { question: 'What does `*args` mean in a Python function?', options: ['Required keyword arguments', 'Arbitrary number of positional arguments', 'A pointer to arguments', 'Default argument values'], correctIndex: 1, explanation: '*args allows a function to accept any number of positional arguments as a tuple.' },
    { question: 'What is a Python decorator?', options: ['A CSS-like style system', 'A function that wraps another function to extend its behavior', 'A comment style', 'A way to create classes'], correctIndex: 1, explanation: 'Decorators are functions that take another function and extend or alter its behavior without modifying it.' },
    { question: 'What does `__init__` do in a Python class?', options: ['Imports the class', 'Initializes a new instance of the class', 'Destroys the object', 'Makes the class private'], correctIndex: 1, explanation: '__init__ is the constructor method called when a new object is instantiated.' },
    { question: 'How do you handle exceptions in Python?', options: ['if/else statements', 'try/except blocks', 'switch/case', 'error() function'], correctIndex: 1, explanation: 'Python uses try/except blocks to handle exceptions gracefully.' },
    { question: 'What is the GIL in Python?', options: ['Global Import Library', 'Global Interpreter Lock', 'Generic Iteration Loop', 'Guarded Integer Logic'], correctIndex: 1, explanation: 'The GIL (Global Interpreter Lock) prevents multiple threads from executing Python bytecode simultaneously.' },
  ],
  React: [
    { question: 'What is JSX?', options: ['A JavaScript engine', 'A syntax extension that allows HTML-like code in JavaScript', 'A state management library', 'A styling framework'], correctIndex: 1, explanation: 'JSX is syntactic sugar for React.createElement() calls, making component code more readable.' },
    { question: 'When does useEffect run with an empty dependency array?', options: ['On every render', 'Only once after the initial mount', 'Only when state changes', 'Never'], correctIndex: 1, explanation: 'An empty dependency array [] causes useEffect to run only once after the initial render.' },
    { question: 'What hook is used for state management in functional components?', options: ['useEffect', 'useContext', 'useState', 'useReducer'], correctIndex: 2, explanation: 'useState hook allows you to add state to functional components.' },
    { question: 'What is prop drilling?', options: ['A performance optimization', 'Passing props through multiple component levels', 'A React build tool', 'A way to drill into DOM'], correctIndex: 1, explanation: 'Prop drilling is when you pass props through many component levels to reach a deeply nested child.' },
    { question: 'What is the purpose of React.memo()?', options: ['Memoizes expensive computations', 'Prevents unnecessary re-renders of functional components', 'Stores data in memory', 'Creates context'], correctIndex: 1, explanation: 'React.memo() is a HOC that memoizes a component, skipping re-render if props haven\'t changed.' },
    { question: 'What does the key prop do in React lists?', options: ['Styles list items', 'Helps React identify changed items for efficient updates', 'Sorts items', 'Filters items'], correctIndex: 1, explanation: 'Keys help React identify which items changed, were added, or removed, enabling efficient DOM updates.' },
    { question: 'What is the Context API used for?', options: ['HTTP requests', 'Global state management without prop drilling', 'Animations', 'Routing'], correctIndex: 1, explanation: 'Context API provides a way to share data between components without passing props through every level.' },
    { question: 'What does useCallback() return?', options: ['A memoized value', 'A memoized callback function', 'A reducer', 'A ref object'], correctIndex: 1, explanation: 'useCallback returns a memoized version of the callback that only changes if dependencies change.' },
  ],
  CSS: [
    { question: 'What does `display: flex` do?', options: ['Makes element invisible', 'Enables flexbox layout', 'Creates a grid', 'Floats the element'], correctIndex: 1, explanation: 'display: flex enables flexbox on the element, making it a flex container.' },
    { question: 'What is the CSS box model?', options: ['A 3D transform', 'Content + padding + border + margin', 'A grid system', 'A color model'], correctIndex: 1, explanation: 'The CSS box model describes how element dimensions are calculated: content, padding, border, and margin.' },
    { question: 'What does `position: sticky` do?', options: ['Element stays fixed on screen', 'Element scrolls until it reaches a threshold then sticks', 'Sticks element to another element', 'Removes from document flow'], correctIndex: 1, explanation: 'sticky positioning makes an element scroll with the page until a threshold is reached, then it sticks.' },
    { question: 'What is CSS specificity?', options: ['How fast CSS loads', 'A ranking system determining which rules apply', 'The speed of animations', 'Number of CSS properties'], correctIndex: 1, explanation: 'Specificity is a weight applied to CSS selectors determining which style rules take precedence.' },
    { question: 'What is a CSS media query used for?', options: ['Fetching data', 'Applying styles based on device characteristics', 'Animating elements', 'Importing fonts'], correctIndex: 1, explanation: 'Media queries apply CSS rules based on characteristics like screen width, enabling responsive design.' },
    { question: 'What does `z-index` control?', options: ['Zoom level', 'Stacking order of positioned elements', 'Element size', 'Animation speed'], correctIndex: 1, explanation: 'z-index controls the stack order of positioned elements. Higher values appear in front.' },
    { question: 'What is the difference between `em` and `rem`?', options: ['No difference', 'em is relative to parent, rem is relative to root', 'rem is relative to parent, em is relative to root', 'em is absolute, rem is relative'], correctIndex: 1, explanation: 'em is relative to the font-size of the parent element, while rem is relative to the root (html) element.' },
  ],
  'Node.js': [
    { question: 'What is Node.js?', options: ['A browser', 'A server-side JavaScript runtime', 'A CSS framework', 'A database'], correctIndex: 1, explanation: 'Node.js is a JavaScript runtime built on Chrome\'s V8 engine that allows JavaScript to run on the server.' },
    { question: 'What is the event loop in Node.js?', options: ['A for loop for events', 'A mechanism handling async operations without blocking', 'A DOM event listener', 'A cron job system'], correctIndex: 1, explanation: 'The event loop allows Node.js to perform non-blocking I/O operations by delegating tasks to the OS.' },
    { question: 'What does `require()` do in Node.js?', options: ['Makes HTTP requests', 'Imports modules', 'Requires user authentication', 'Creates a server'], correctIndex: 1, explanation: 'require() is the CommonJS way to import modules in Node.js.' },
    { question: 'What is middleware in Express?', options: ['A database layer', 'Functions with access to req, res, and next', 'A routing system', 'An authentication protocol'], correctIndex: 1, explanation: 'Middleware functions execute during the request-response cycle, with access to req, res, and next().' },
    { question: 'What is npm?', options: ['Node Package Manager', 'Network Protocol Module', 'New Programming Method', 'Node Process Manager'], correctIndex: 0, explanation: 'npm (Node Package Manager) is the default package manager for Node.js for installing and managing dependencies.' },
  ],
  Databases: [
    { question: 'What is a primary key?', options: ['The first column', 'A unique identifier for each record', 'A foreign key', 'An index'], correctIndex: 1, explanation: 'A primary key uniquely identifies each row in a table and cannot contain NULL values.' },
    { question: 'What does SQL JOIN do?', options: ['Splits tables', 'Combines rows from multiple tables based on a related column', 'Deletes duplicate rows', 'Creates a new table'], correctIndex: 1, explanation: 'JOIN combines rows from two or more tables based on a related column between them.' },
    { question: 'What is MongoDB?', options: ['A SQL database', 'A NoSQL document database', 'A graph database', 'A cache system'], correctIndex: 1, explanation: 'MongoDB is a NoSQL database that stores data in flexible, JSON-like documents called BSON.' },
    { question: 'What is database normalization?', options: ['Making the database faster', 'Organizing data to reduce redundancy and dependency', 'Encrypting the database', 'Backing up data'], correctIndex: 1, explanation: 'Normalization organizes database tables to reduce redundancy and improve data integrity.' },
    { question: 'What is an index in a database?', options: ['The first record', 'A data structure that speeds up data retrieval', 'A primary key', 'A foreign key'], correctIndex: 1, explanation: 'An index is a data structure that improves the speed of data retrieval operations on a table.' },
    { question: 'What is ACID in databases?', options: ['Authentication, Consistency, Isolation, Durability', 'Atomicity, Consistency, Isolation, Durability', 'Access, Control, Integrity, Data', 'A type of encryption'], correctIndex: 1, explanation: 'ACID (Atomicity, Consistency, Isolation, Durability) ensures reliable database transactions.' },
  ],
  Git: [
    { question: 'What does `git commit` do?', options: ['Pushes to remote', 'Saves staged changes to the local repository', 'Creates a branch', 'Merges branches'], correctIndex: 1, explanation: 'git commit saves the staged snapshot to the project history.' },
    { question: 'What is a merge conflict?', options: ['A network error', 'When two branches modify the same lines differently', 'A corrupted repository', 'A permission error'], correctIndex: 1, explanation: 'A merge conflict occurs when Git cannot automatically resolve differences in code between branches.' },
    { question: 'What does `git stash` do?', options: ['Deletes changes', 'Temporarily shelves uncommitted changes', 'Creates a new branch', 'Pushes to remote'], correctIndex: 1, explanation: 'git stash temporarily shelves (or stashes) changes so you can work on something else.' },
    { question: 'What is a pull request?', options: ['Pulling the latest code', 'A request to merge a branch into another', 'A code backup', 'A CI/CD pipeline'], correctIndex: 1, explanation: 'A pull request is a mechanism to notify team members about changes you\'ve pushed, requesting code review before merging.' },
    { question: 'What is `git rebase`?', options: ['Undoes commits', 'Reapplies commits on top of another base tip', 'Creates a new repository', 'Renames a branch'], correctIndex: 1, explanation: 'git rebase integrates changes by reapplying commits on top of another branch, creating a linear history.' },
  ],
  Algorithms: [
    { question: 'What is Big O notation?', options: ['A sorting algorithm', 'A way to describe algorithm time/space complexity', 'A binary operator', 'A data structure'], correctIndex: 1, explanation: 'Big O notation describes the worst-case growth rate of an algorithm\'s time or space requirements.' },
    { question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correctIndex: 2, explanation: 'Binary search divides the search space in half each iteration, giving O(log n) complexity.' },
    { question: 'Which sorting algorithm has O(n log n) average complexity?', options: ['Bubble sort', 'Selection sort', 'Merge sort', 'Insertion sort'], correctIndex: 2, explanation: 'Merge sort consistently achieves O(n log n) by dividing the array and merging sorted halves.' },
    { question: 'What is a hash table?', options: ['A database table', 'A data structure with O(1) average lookup using a hash function', 'A sorting algorithm', 'A tree structure'], correctIndex: 1, explanation: 'A hash table maps keys to values using a hash function, enabling O(1) average-case lookups.' },
    { question: 'What is dynamic programming?', options: ['Programming with dynamic languages', 'Optimizing by storing results of overlapping subproblems', 'Parallel programming', 'Event-driven programming'], correctIndex: 1, explanation: 'Dynamic programming solves complex problems by breaking them into overlapping subproblems and caching results.' },
  ],
  'Data Science': [
    { question: 'What is overfitting?', options: ['Model is too simple', 'Model performs well on training but poorly on new data', 'Model learns too slowly', 'Model ignores training data'], correctIndex: 1, explanation: 'Overfitting occurs when a model learns training data too specifically and fails to generalize.' },
    { question: 'What is cross-validation?', options: ['Checking code manually', 'A technique to evaluate model generalization by training on subsets', 'A type of neural network', 'A data cleaning method'], correctIndex: 1, explanation: 'Cross-validation evaluates a model by training and testing on different subsets of the data.' },
    { question: 'What is feature engineering?', options: ['Building physical features', 'Creating/transforming input variables to improve model performance', 'A type of neural network layer', 'A data storage format'], correctIndex: 1, explanation: 'Feature engineering creates or transforms input variables to make patterns more accessible to ML algorithms.' },
    { question: 'What does correlation measure?', options: ['Causation between variables', 'The strength and direction of linear relationship between variables', 'The mean of a dataset', 'The variance in data'], correctIndex: 1, explanation: 'Correlation measures the degree to which two variables move together, ranging from -1 to +1.' },
    { question: 'What is the purpose of train/test split?', options: ['To make models faster', 'To evaluate performance on unseen data', 'To reduce dataset size', 'To normalize features'], correctIndex: 1, explanation: 'Splitting data ensures the model is evaluated on data it hasn\'t seen, simulating real-world performance.' },
  ],
  'Machine Learning': [
    { question: 'What is supervised learning?', options: ['Learning with a teacher present', 'Training on labeled data to predict outputs', 'Unsupervised pattern finding', 'Reinforcement-based learning'], correctIndex: 1, explanation: 'Supervised learning trains models on labeled examples to learn input-output mappings.' },
    { question: 'What is gradient descent?', options: ['A data preprocessing step', 'An optimization algorithm minimizing loss by following the gradient', 'A neural network type', 'A feature selection method'], correctIndex: 1, explanation: 'Gradient descent iteratively adjusts model parameters in the direction of steepest descent of the loss function.' },
    { question: 'What is a neural network?', options: ['A biological brain', 'A series of interconnected layers of nodes inspired by the brain', 'A decision tree', 'A clustering algorithm'], correctIndex: 1, explanation: 'A neural network consists of layers of interconnected nodes that learn patterns from data.' },
    { question: 'What is regularization?', options: ['Making models more complex', 'A technique to prevent overfitting by penalizing complexity', 'Normalizing input data', 'A type of activation function'], correctIndex: 1, explanation: 'Regularization adds a penalty for complexity to the loss function, discouraging overfitting.' },
    { question: 'What is the purpose of an activation function?', options: ['To activate the neural network', 'To introduce non-linearity into the network', 'To initialize weights', 'To normalize outputs'], correctIndex: 1, explanation: 'Activation functions introduce non-linearity, allowing neural networks to learn complex patterns.' },
  ],
  Cybersecurity: [
    { question: 'What is SQL injection?', options: ['A legal injection treatment', 'Inserting malicious SQL code into a query', 'A database normalization technique', 'A type of encryption'], correctIndex: 1, explanation: 'SQL injection is an attack where malicious SQL statements are inserted into input fields to manipulate databases.' },
    { question: 'What is the CIA triad?', options: ['A government agency', 'Confidentiality, Integrity, Availability', 'Control, Integrity, Authentication', 'Classification, Information, Access'], correctIndex: 1, explanation: 'The CIA triad (Confidentiality, Integrity, Availability) is the foundation of information security.' },
    { question: 'What is phishing?', options: ['A network scan', 'A social engineering attack tricking users into revealing credentials', 'A type of firewall', 'A port scanning technique'], correctIndex: 1, explanation: 'Phishing uses deceptive emails or websites to trick users into revealing sensitive information.' },
    { question: 'What is HTTPS?', options: ['A hacking tool', 'HTTP with TLS encryption for secure communication', 'A firewall protocol', 'A vulnerability scanner'], correctIndex: 1, explanation: 'HTTPS is HTTP secured with TLS/SSL encryption, protecting data in transit between client and server.' },
    { question: 'What is two-factor authentication (2FA)?', options: ['Two passwords', 'Authentication requiring something you know and something you have/are', 'Dual encryption', 'Biometric login only'], correctIndex: 1, explanation: '2FA requires two forms of verification, typically a password plus a code from a device or app.' },
  ],
  HTML: [
    { question: 'What does HTML stand for?', options: ['HyperText Markup Language', 'High-Tech Modern Layout', 'Home Tool Markup Language', 'HyperTransfer Markup Logic'], correctIndex: 0, explanation: 'HTML stands for HyperText Markup Language, the standard language for creating web pages.' },
    { question: 'Which HTML tag creates a hyperlink?', options: ['<link>', '<a>', '<href>', '<url>'], correctIndex: 1, explanation: 'The <a> (anchor) tag with an href attribute creates hyperlinks in HTML.' },
    { question: 'What is semantic HTML?', options: ['HTML with CSS', 'Using HTML elements according to their intended meaning', 'HTML with JavaScript', 'Compressed HTML'], correctIndex: 1, explanation: 'Semantic HTML uses tags like <header>, <nav>, <article>, <footer> that convey meaning about their content.' },
    { question: 'What does the alt attribute on <img> do?', options: ['Changes image color', 'Provides alternative text for accessibility and SEO', 'Makes image clickable', 'Sets image size'], correctIndex: 1, explanation: 'The alt attribute provides alternative text for images, important for accessibility and when images fail to load.' },
    { question: 'What is the DOM?', options: ['Document Object Model — a programming interface for HTML', 'Domain Object Management', 'Dynamic Output Module', 'A CSS framework'], correctIndex: 0, explanation: 'The DOM (Document Object Model) represents an HTML document as a tree of objects that can be manipulated with JavaScript.' },
  ],
};

function difficultyFilter(questions, difficulty, count) {
  // Simulate difficulty by taking different slices
  let pool = [...questions];
  if (difficulty === 'Easy') pool = pool.slice(0, Math.ceil(pool.length * 0.5));
  else if (difficulty === 'Medium') pool = pool.slice(Math.floor(pool.length * 0.2), Math.ceil(pool.length * 0.8));
  else pool = pool.slice(Math.floor(pool.length * 0.4));

  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export const generateQuiz = async (req, res, next) => {
  try {
    const { topic, difficulty = 'Medium', count = 10 } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, error: 'Topic is required', statusCode: 400 });
    }

    const bank = QUESTION_BANK[topic];
    if (!bank) {
      return res.status(400).json({ success: false, error: `Topic "${topic}" not supported`, statusCode: 400 });
    }

    const numCount = Math.max(5, Math.min(20, parseInt(count) || 10));
    const questions = difficultyFilter(bank, difficulty, numCount);

    res.json({ success: true, data: { topic, difficulty, questions } });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/ai/skills ───────────────────────────────────────────────────────

export const getSkills = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const progresses = await Progress.find({ user: userId }).populate('course');

    if (progresses.length === 0) {
      return res.json({
        success: true,
        data: {
          skills: [],
          strongestSkill: null,
          improvementArea: null,
          weeklyProgress: buildWeeklyProgress([]),
        },
      });
    }

    // Aggregate skills by category
    const skillMap = {};
    const allScores = [];

    for (const p of progresses) {
      const category = p.course?.category || 'General';
      if (!skillMap[category]) {
        skillMap[category] = { scores: [], lessonsCompleted: 0, name: category };
      }
      skillMap[category].lessonsCompleted += p.completedLessons.length;
      for (const qr of p.quizResults) {
        if (qr.score !== undefined) {
          skillMap[category].scores.push({ score: qr.score, date: qr.attemptedAt });
          allScores.push({ score: qr.score, date: qr.attemptedAt });
        }
      }
    }

    const skills = Object.values(skillMap).map((s) => {
      const avgScore = s.scores.length
        ? Math.round(s.scores.reduce((a, b) => a + b.score, 0) / s.scores.length)
        : 0;
      const trend = computeTrend(s.scores.map((x) => x.score));
      return {
        name: s.name,
        level: deriveSkillLevel(avgScore),
        score: avgScore,
        lessonsCompleted: s.lessonsCompleted,
        trend,
      };
    });

    skills.sort((a, b) => b.score - a.score);
    const strongestSkill = skills[0]?.name || null;
    const improvementArea = skills[skills.length - 1]?.name || null;

    const weeklyProgress = buildWeeklyProgress(allScores);

    res.json({
      success: true,
      data: { skills, strongestSkill, improvementArea, weeklyProgress },
    });
  } catch (err) {
    next(err);
  }
};

function buildWeeklyProgress(allScores) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);

  return days.map((day, idx) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + idx);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayScores = allScores.filter((s) => {
      const d = new Date(s.date);
      return d >= dayStart && d <= dayEnd;
    });

    const avgScore = dayScores.length
      ? Math.round(dayScores.reduce((a, b) => a + b.score, 0) / dayScores.length)
      : 0;

    return {
      week: day,
      lessonsCompleted: dayScores.length,
      avgScore,
    };
  });
}
