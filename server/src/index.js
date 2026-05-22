import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import User from './models/User.js';
import Course from './models/Course.js';
import Lesson from './models/Lesson.js';
import Exam from './models/Exam.js';

import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import userRoutes from './routes/userRoutes.js';
import instructorRoutes from './routes/instructorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import instructorPanelRoutes from './routes/instructorPanelRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import studyRoomRoutes from './routes/studyRoomRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import mentorshipRoutes from './routes/mentorshipRoutes.js';
import errorHandler from './middleware/errorHandler.js';

import { DEMO_USERS } from './config/demoUsers.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Server is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/instructor-panel', instructorPanelRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', forumRoutes);
app.use('/api/study-rooms', studyRoomRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/mentorship', mentorshipRoutes);

app.use(errorHandler);

async function seedDemoUsers() {
  for (const u of DEMO_USERS) {
    const password = await bcrypt.hash(u.password, 10);
    await User.updateOne(
      { email: u.email },
      { $set: { email: u.email, password, role: u.role, name: u.name, bio: u.bio || '' } },
      { upsert: true }
    );
  }
}

async function seedCourses() {
  const admin = await User.findOne({ email: 'admin@learnify.com' });
  if (!admin) return;

  const coursesData = [
    {
      title: 'JavaScript Fundamentals',
      slug: 'javascript-fundamentals',
      description: 'Master the building blocks of modern web development with JavaScript. Learn variables, functions, objects, async programming, and DOM manipulation through hands-on projects.',
      thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&q=80',
      category: 'Web Dev',
      tags: ['javascript', 'web', 'beginner', 'es6'],
      level: 'beginner',
      estimatedDuration: 480,
      sections: [
        {
          title: 'Getting Started with JavaScript',
          order: 0,
          lessons: [
            {
              title: 'Introduction to JavaScript',
              description: 'What is JavaScript and why is it the language of the web? We cover the history, evolution, and role of JS in modern development.',
              order: 0,
              videoUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk',
              duration: 15,
              resources: [
                { name: 'JavaScript Cheat Sheet', url: 'https://htmlcheatsheet.com/js/', type: 'pdf', fileSize: '245 KB', downloadCount: 0 },
                { name: 'Course Starter Files', url: 'https://github.com/bradtraversy/vanillawebprojects/archive/refs/heads/master.zip', type: 'zip', fileSize: '1.2 MB', downloadCount: 0 },
              ],
              quiz: {
                questions: [
                  { question: 'What is JavaScript primarily used for?', options: ['Styling web pages', 'Adding interactivity to web pages', 'Database management', 'Server configuration'], correctIndex: 1, explanation: 'JavaScript is primarily used to add interactivity and dynamic behavior to web pages.' },
                  { question: 'Which keyword declares a block-scoped variable in modern JS?', options: ['var', 'int', 'let', 'string'], correctIndex: 2, explanation: 'let declares a block-scoped variable, unlike var which is function-scoped.' },
                ],
              },
            },
            {
              title: 'Variables, Data Types & Operators',
              description: 'Deep dive into JavaScript data types: strings, numbers, booleans, null, undefined, objects, and symbols. Learn how to declare variables with var, let, and const.',
              order: 1,
              videoUrl: 'https://www.youtube.com/embed/9emXNzqCKyg',
              duration: 20,
              quiz: {
                questions: [
                  { question: 'Which of the following is NOT a primitive data type in JavaScript?', options: ['string', 'number', 'array', 'boolean'], correctIndex: 2, explanation: 'Arrays are objects in JavaScript, not primitive types.' },
                  { question: 'What does typeof null return in JavaScript?', options: ['"null"', '"undefined"', '"object"', '"boolean"'], correctIndex: 2, explanation: 'This is a well-known JavaScript quirk — typeof null returns "object".' },
                ],
              },
              codingChallenge: { prompt: 'Write a function sum(a, b) that returns the sum of two numbers.', starterCode: 'function sum(a, b) {\n  // your code here\n}', language: 'javascript', solution: 'function sum(a, b) {\n  return a + b;\n}' },
            },
            {
              title: 'Functions and Scope',
              description: 'Learn to write reusable code with functions. Understand function declarations, expressions, arrow functions, and how scope and closures work.',
              order: 2,
              videoUrl: 'https://www.youtube.com/embed/xUI5Tsl2JpY',
              duration: 25,
              quiz: {
                questions: [
                  { question: 'What is a closure in JavaScript?', options: ['A function that has no parameters', 'A function with access to its outer scope variables', 'A self-invoking function', 'A function that returns undefined'], correctIndex: 1, explanation: 'A closure is a function that retains access to variables from its outer (enclosing) scope even after that scope has finished executing.' },
                ],
              },
            },
          ],
        },
        {
          title: 'Advanced JavaScript Concepts',
          order: 1,
          lessons: [
            {
              title: 'Arrays and Array Methods',
              description: 'Master JavaScript arrays with map, filter, reduce, forEach, and more. Understand array destructuring and spread operators.',
              order: 3,
              videoUrl: 'https://www.youtube.com/embed/R8rmfD9Y5-c',
              duration: 30,
              quiz: {
                questions: [
                  { question: 'Which array method creates a new array with elements that pass a test?', options: ['map()', 'filter()', 'reduce()', 'forEach()'], correctIndex: 1, explanation: 'filter() creates a new array with all elements that pass the test implemented by the provided function.' },
                  { question: 'What does Array.map() return?', options: ['The original array mutated', 'undefined', 'A new array', 'A single value'], correctIndex: 2, explanation: 'map() creates and returns a new array populated with the results of calling the provided function on every element.' },
                ],
              },
            },
            {
              title: 'Promises and Async/Await',
              description: 'Tackle asynchronous JavaScript with confidence. Learn Promises, chaining, error handling, and the modern async/await syntax.',
              order: 4,
              videoUrl: 'https://www.youtube.com/embed/PoRJizFvM7s',
              duration: 35,
              quiz: {
                questions: [
                  { question: 'What does async/await syntax do?', options: ['Makes code run faster', 'Makes async code look and behave like sync code', 'Removes the need for Promises', 'Only works with fetch API'], correctIndex: 1, explanation: 'async/await is syntactic sugar over Promises that makes asynchronous code easier to write and read.' },
                ],
              },
              codingChallenge: { prompt: 'Write an async function fetchData(url) that fetches data from a URL and returns the JSON response.', starterCode: 'async function fetchData(url) {\n  // your code here\n}', language: 'javascript', solution: 'async function fetchData(url) {\n  const response = await fetch(url);\n  return await response.json();\n}' },
            },
          ],
        },
      ],
      exam: {
        questions: [
          { question: 'Which method is used to add elements to the end of an array?', options: ['push()', 'pop()', 'shift()', 'unshift()'], correctIndex: 0, explanation: 'push() adds one or more elements to the end of an array.' },
          { question: 'What is the output of typeof [] in JavaScript?', options: ['"array"', '"object"', '"undefined"', '"list"'], correctIndex: 1, explanation: 'Arrays are objects in JavaScript, so typeof [] returns "object".' },
          { question: 'Which keyword is used to define a constant variable?', options: ['var', 'let', 'const', 'static'], correctIndex: 2, explanation: 'const declares a constant — its binding cannot be reassigned.' },
          { question: 'What does the spread operator (...) do?', options: ['Deletes array elements', 'Spreads iterable elements', 'Creates a promise', 'Declares a generator'], correctIndex: 1, explanation: 'The spread operator expands an iterable into individual elements.' },
          { question: 'What is a Promise in JavaScript?', options: ['A variable declaration', 'An object representing eventual completion of an async operation', 'A type of loop', 'A DOM method'], correctIndex: 1, explanation: 'A Promise is an object representing the eventual completion or failure of an asynchronous operation.' },
        ],
        passingScore: 70,
        timeLimit: 30,
      },
    },
    {
      title: 'Python for Data Science',
      slug: 'python-for-data-science',
      description: 'Go from zero to data scientist with Python. Learn NumPy, Pandas, Matplotlib, and machine learning fundamentals through real-world datasets and projects.',
      thumbnail: 'https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=800&q=80',
      category: 'Data Science',
      tags: ['python', 'data science', 'machine learning', 'pandas'],
      level: 'intermediate',
      estimatedDuration: 600,
      sections: [
        {
          title: 'Python Data Science Foundations',
          order: 0,
          lessons: [
            {
              title: 'Python Setup and Jupyter Notebooks',
              description: 'Set up your data science environment. Install Anaconda, Jupyter, and essential libraries. Learn notebook basics and markdown cells.',
              order: 0,
              videoUrl: 'https://www.youtube.com/embed/HW29067qVWk',
              duration: 20,
              quiz: {
                questions: [
                  { question: 'What is Jupyter Notebook primarily used for?', options: ['Web development', 'Interactive data science and analysis', 'System administration', 'Game development'], correctIndex: 1, explanation: 'Jupyter Notebooks are interactive computing environments ideal for data science, analysis, and visualization.' },
                  { question: 'Which library is known as the foundation of numerical computing in Python?', options: ['Pandas', 'Matplotlib', 'NumPy', 'Scikit-learn'], correctIndex: 2, explanation: 'NumPy provides the fundamental data structures and operations for numerical computing in Python.' },
                ],
              },
            },
            {
              title: 'NumPy Arrays and Operations',
              description: 'Master NumPy arrays, indexing, slicing, broadcasting, and vectorized operations that make data science fast.',
              order: 1,
              videoUrl: 'https://www.youtube.com/embed/QUT1VHiLmmI',
              duration: 35,
              quiz: {
                questions: [
                  { question: 'What is broadcasting in NumPy?', options: ['Sending data over network', 'Performing operations on arrays of different shapes', 'Printing array values', 'Loading data from files'], correctIndex: 1, explanation: 'Broadcasting allows NumPy to work with arrays of different shapes when performing arithmetic operations.' },
                ],
              },
              codingChallenge: { prompt: 'Create a NumPy array of numbers 1-10 and compute the mean.', starterCode: 'import numpy as np\n\ndef compute_mean():\n    # your code here\n    pass', language: 'python', solution: 'import numpy as np\n\ndef compute_mean():\n    arr = np.arange(1, 11)\n    return arr.mean()' },
            },
            {
              title: 'Pandas DataFrames',
              description: 'Learn to manipulate tabular data with Pandas. Read CSV/Excel, filter, group, merge, and transform data like a pro.',
              order: 2,
              videoUrl: 'https://www.youtube.com/embed/vmEHCJofslg',
              duration: 40,
              quiz: {
                questions: [
                  { question: 'Which Pandas method reads a CSV file into a DataFrame?', options: ['pd.read_csv()', 'pd.load_csv()', 'pd.open_csv()', 'pd.import_csv()'], correctIndex: 0, explanation: 'pd.read_csv() is the standard Pandas function for loading CSV files into a DataFrame.' },
                  { question: 'What does DataFrame.groupby() do?', options: ['Groups rows into a new DataFrame based on a column', 'Removes duplicate rows', 'Sorts the DataFrame', 'Fills missing values'], correctIndex: 0, explanation: 'groupby() splits the data into groups based on criteria, allowing aggregation operations.' },
                ],
              },
            },
          ],
        },
        {
          title: 'Data Visualization and ML Intro',
          order: 1,
          lessons: [
            {
              title: 'Matplotlib and Seaborn',
              description: 'Create stunning data visualizations: line charts, bar plots, scatter plots, heatmaps, and more with Matplotlib and Seaborn.',
              order: 3,
              videoUrl: 'https://www.youtube.com/embed/0P7QnIQDBJY',
              duration: 30,
              quiz: {
                questions: [
                  { question: 'What is Seaborn built on top of?', options: ['NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn'], correctIndex: 2, explanation: 'Seaborn is a statistical data visualization library built on top of Matplotlib.' },
                ],
              },
            },
            {
              title: 'Introduction to Machine Learning with Scikit-learn',
              description: 'Understand supervised vs unsupervised learning. Build your first ML models: linear regression, decision trees, and k-means clustering.',
              order: 4,
              videoUrl: 'https://www.youtube.com/embed/0B5eIE_1vpU',
              duration: 45,
              quiz: {
                questions: [
                  { question: 'What is the purpose of train/test split in machine learning?', options: ['To speed up training', 'To evaluate model performance on unseen data', 'To reduce dataset size', 'To normalize features'], correctIndex: 1, explanation: 'Train/test split evaluates how well the model generalizes to new, unseen data.' },
                  { question: 'Which algorithm is used for predicting a continuous value?', options: ['Classification', 'Clustering', 'Regression', 'Dimensionality reduction'], correctIndex: 2, explanation: 'Regression algorithms predict continuous numerical values.' },
                ],
              },
            },
          ],
        },
      ],
      exam: {
        questions: [
          { question: 'Which Python library is primarily used for data manipulation?', options: ['NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn'], correctIndex: 1, explanation: 'Pandas is the primary library for data manipulation and analysis in Python.' },
          { question: 'What does df.describe() return in Pandas?', options: ['First 5 rows', 'Statistical summary of numerical columns', 'Column data types', 'Missing values count'], correctIndex: 1, explanation: 'describe() generates descriptive statistics including count, mean, std, min, and percentiles.' },
          { question: 'What is overfitting in machine learning?', options: ['Model performs well on training and test data', 'Model performs well on training but poorly on test data', 'Model fails to learn from training data', 'Model has too few parameters'], correctIndex: 1, explanation: 'Overfitting occurs when a model learns training data too well, failing to generalize to new data.' },
          { question: 'Which method fills missing values in a Pandas DataFrame?', options: ['fillna()', 'dropna()', 'replace()', 'impute()'], correctIndex: 0, explanation: 'fillna() fills missing values with a specified value or method.' },
          { question: 'What does matplotlib.pyplot.show() do?', options: ['Saves the figure to file', 'Displays the current figure', 'Clears the plot', 'Creates a new figure'], correctIndex: 1, explanation: 'plt.show() displays all open figures.' },
        ],
        passingScore: 70,
        timeLimit: 30,
      },
    },
    {
      title: 'React & Modern Frontend',
      slug: 'react-modern-frontend',
      description: 'Build powerful, scalable user interfaces with React 18. Master hooks, context API, React Router, state management, and performance optimization.',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
      category: 'Web Dev',
      tags: ['react', 'frontend', 'hooks', 'javascript'],
      level: 'intermediate',
      estimatedDuration: 540,
      sections: [
        {
          title: 'React Foundations',
          order: 0,
          lessons: [
            {
              title: 'Why React? JSX and Components',
              description: 'Understand the React philosophy, virtual DOM, component-based architecture, and JSX syntax. Build your first functional component.',
              order: 0,
              videoUrl: 'https://www.youtube.com/embed/Tn6-PIqc4UM',
              duration: 25,
              quiz: {
                questions: [
                  { question: 'What is JSX?', options: ['A JavaScript engine', 'A syntax extension that looks like HTML in JavaScript', 'A styling framework', 'A package manager'], correctIndex: 1, explanation: 'JSX is a syntax extension that allows you to write HTML-like code in your JavaScript files.' },
                  { question: 'What is the Virtual DOM?', options: ['The actual browser DOM', 'A server-side rendering technique', 'A lightweight copy of the real DOM used for performance optimization', 'A CSS framework'], correctIndex: 2, explanation: 'The Virtual DOM is a lightweight in-memory representation of the real DOM that React uses to batch updates.' },
                ],
              },
            },
            {
              title: 'State and Props',
              description: 'Master the two fundamental pillars of React: state (internal data) and props (external data). Learn how data flows in React applications.',
              order: 1,
              videoUrl: 'https://www.youtube.com/embed/4ORZ1GmjaMc',
              duration: 30,
              quiz: {
                questions: [
                  { question: 'What hook is used to add state to a functional component?', options: ['useEffect', 'useContext', 'useState', 'useRef'], correctIndex: 2, explanation: 'useState is the hook that adds state management to functional React components.' },
                  { question: 'Can you directly modify state in React?', options: ['Yes', 'No, use setState or the setter from useState', 'Only in class components', 'Only in useEffect'], correctIndex: 1, explanation: 'State must always be updated via the setter function to trigger re-renders.' },
                ],
              },
              codingChallenge: { prompt: 'Create a Counter component with useState that increments when a button is clicked.', starterCode: 'function Counter() {\n  // add state and return JSX\n}', language: 'javascript', solution: 'function Counter() {\n  const [count, setCount] = React.useState(0);\n  return (\n    <div>\n      <p>{count}</p>\n      <button onClick={() => setCount(count + 1)}>Increment</button>\n    </div>\n  );\n}' },
            },
            {
              title: 'useEffect and Data Fetching',
              description: 'Harness side effects with useEffect. Learn the dependency array, cleanup functions, and how to fetch data from APIs in React.',
              order: 2,
              videoUrl: 'https://www.youtube.com/embed/0ZJgIjIuY7U',
              duration: 35,
              quiz: {
                questions: [
                  { question: 'When does useEffect run with an empty dependency array []?', options: ['On every render', 'Only on the first render', 'Only when dependencies change', 'Never'], correctIndex: 1, explanation: 'An empty dependency array causes useEffect to run only once after the initial mount.' },
                ],
              },
            },
          ],
        },
        {
          title: 'Advanced React Patterns',
          order: 1,
          lessons: [
            {
              title: 'Context API and useContext',
              description: 'Avoid prop drilling with React Context. Build a global state system using createContext, Provider, and useContext hook.',
              order: 3,
              videoUrl: 'https://www.youtube.com/embed/5LrDIWkK_Bc',
              duration: 30,
              quiz: {
                questions: [
                  { question: 'What problem does Context API solve?', options: ['Code splitting', 'Prop drilling', 'Performance optimization', 'Server-side rendering'], correctIndex: 1, explanation: 'Context API eliminates prop drilling by providing a way to share values between components without passing props through every level.' },
                ],
              },
            },
            {
              title: 'React Router and Navigation',
              description: 'Build single-page applications with React Router v6. Learn route parameters, nested routes, protected routes, and programmatic navigation.',
              order: 4,
              videoUrl: 'https://www.youtube.com/embed/Ul3y1LXxzdU',
              duration: 35,
              quiz: {
                questions: [
                  { question: 'Which component renders the first matching route in React Router v6?', options: ['<Switch>', '<Router>', '<Routes>', '<Route>'], correctIndex: 2, explanation: 'In React Router v6, <Routes> renders the first child <Route> that matches the current URL.' },
                  { question: 'How do you access URL parameters in React Router v6?', options: ['props.params', 'useParams() hook', 'window.location', 'useRouter()'], correctIndex: 1, explanation: 'useParams() hook returns an object of key/value pairs from the URL parameters.' },
                ],
              },
            },
          ],
        },
      ],
      exam: {
        questions: [
          { question: 'What is the correct way to update state in React?', options: ['Directly assign: state = newValue', 'Use the setter function from useState', 'Modify state.value', 'Use document.setState()'], correctIndex: 1, explanation: 'Always use the setter function returned by useState to update state.' },
          { question: 'What is React.memo() used for?', options: ['Memoizing expensive computations', 'Preventing unnecessary re-renders of functional components', 'Storing data in localStorage', 'Creating context'], correctIndex: 1, explanation: 'React.memo() is a higher-order component that memoizes a component, preventing re-renders when props haven\'t changed.' },
          { question: 'What hook would you use to store a mutable value that doesn\'t cause re-renders?', options: ['useState', 'useEffect', 'useRef', 'useCallback'], correctIndex: 2, explanation: 'useRef returns a mutable object whose .current property is initialized to the passed argument, and changes don\'t cause re-renders.' },
          { question: 'What is the purpose of the key prop in React lists?', options: ['To style list items', 'To help React identify which items changed, added, or removed', 'To sort list items', 'To filter list items'], correctIndex: 1, explanation: 'Keys help React identify which items have changed, are added, or are removed, enabling efficient DOM updates.' },
          { question: 'What does useCallback() do?', options: ['Runs a function after every render', 'Returns a memoized callback function', 'Creates a new context', 'Fetches data from an API'], correctIndex: 1, explanation: 'useCallback returns a memoized version of the callback that only changes if dependencies have changed.' },
        ],
        passingScore: 70,
        timeLimit: 30,
      },
    },
  ];

  for (const courseData of coursesData) {
    const existing = await Course.findOne({ slug: courseData.slug });
    if (existing) continue;

    // Create course shell
    const course = await Course.create({
      title: courseData.title,
      slug: courseData.slug,
      description: courseData.description,
      thumbnail: courseData.thumbnail,
      category: courseData.category,
      tags: courseData.tags,
      level: courseData.level,
      estimatedDuration: courseData.estimatedDuration,
      instructor: admin._id,
      status: 'published',
    });

    // Create sections and lessons
    const builtSections = [];
    for (const sectionData of courseData.sections) {
      const lessonIds = [];
      for (const lessonData of sectionData.lessons) {
        const lesson = await Lesson.create({
          title: lessonData.title,
          description: lessonData.description,
          order: lessonData.order,
          videoUrl: lessonData.videoUrl || '',
          resources: lessonData.resources || [],
          quiz: lessonData.quiz || { questions: [] },
          codingChallenge: lessonData.codingChallenge || {},
          course: course._id,
          duration: lessonData.duration || 10,
        });
        lessonIds.push(lesson._id);
      }
      builtSections.push({ title: sectionData.title, order: sectionData.order, lessons: lessonIds });
    }

    course.sections = builtSections;

    // Create final exam
    const exam = await Exam.create({
      course: course._id,
      questions: courseData.exam.questions,
      passingScore: courseData.exam.passingScore,
      timeLimit: courseData.exam.timeLimit,
    });
    course.finalExam = exam._id;
    await course.save();
  }
}

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  await seedDemoUsers();
  await seedCourses();
  console.log('Seeding complete');
  app.listen(process.env.PORT, () => console.log(`Server listening on port ${process.env.PORT}`));
}

start();
