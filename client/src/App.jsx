import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Auth from './pages/Auth';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CourseViewer from './pages/CourseViewer';
import Exam from './pages/Exam';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourseBuilder from './pages/CourseBuilder';
import Instructors from './pages/Instructors';
import InstructorProfile from './pages/InstructorProfile';
import Certificate from './pages/Certificate';
import Bookmarks from './pages/Bookmarks';
import NotFound from './pages/NotFound';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorCourses from './pages/InstructorCourses';
import CourseAnalytics from './pages/CourseAnalytics';
import InstructorStudents from './pages/InstructorStudents';
import InstructorCertificates from './pages/InstructorCertificates';
import InstructorQuizzes from './pages/InstructorQuizzes';
import AIHub from './pages/AIHub';
import AIRecommendations from './pages/AIRecommendations';
import AIRoadmap from './pages/AIRoadmap';
import AIChat from './pages/AIChat';
import AISkillTracker from './pages/AISkillTracker';
import AIQuizGenerator from './pages/AIQuizGenerator';
import CourseForum from './pages/CourseForum';
import StudyRooms from './pages/StudyRooms';
import Leaderboard from './pages/Leaderboard';
import MyNotes from './pages/MyNotes';
import PeerReview from './pages/PeerReview';
import Challenges from './pages/Challenges';
import UserProfile from './pages/UserProfile';
import Library from './pages/Library';
import Mentorship from './pages/Mentorship';
import InstructorMentorship from './pages/InstructorMentorship';

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: '12px', fontWeight: '500' },
            success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
            error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
          }}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route
            path="/learn/:slug"
            element={<ProtectedRoute><CourseViewer /></ProtectedRoute>}
          />
          <Route
            path="/exam/:courseId"
            element={<ProtectedRoute><Exam /></ProtectedRoute>}
          />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<AdminRoute><AdminDashboard /></AdminRoute>}
          />
          <Route
            path="/admin/courses/new"
            element={<AdminRoute><CourseBuilder /></AdminRoute>}
          />
          <Route
            path="/admin/courses/:id/edit"
            element={<AdminRoute><CourseBuilder /></AdminRoute>}
          />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/instructors/:id" element={<InstructorProfile />} />
          <Route path="/certificate/:certificateId" element={<Certificate />} />
          <Route
            path="/bookmarks"
            element={<ProtectedRoute><Bookmarks /></ProtectedRoute>}
          />
          <Route
            path="/instructor"
            element={<AdminRoute><InstructorDashboard /></AdminRoute>}
          />
          <Route
            path="/instructor/courses"
            element={<AdminRoute><InstructorCourses /></AdminRoute>}
          />
          <Route
            path="/instructor/courses/:id/analytics"
            element={<AdminRoute><CourseAnalytics /></AdminRoute>}
          />
          <Route
            path="/instructor/students"
            element={<AdminRoute><InstructorStudents /></AdminRoute>}
          />
          <Route
            path="/instructor/certificates"
            element={<AdminRoute><InstructorCertificates /></AdminRoute>}
          />
          <Route
            path="/instructor/quizzes"
            element={<AdminRoute><InstructorQuizzes /></AdminRoute>}
          />
          <Route
            path="/ai"
            element={<ProtectedRoute><AIHub /></ProtectedRoute>}
          />
          <Route
            path="/ai/recommendations"
            element={<ProtectedRoute><AIRecommendations /></ProtectedRoute>}
          />
          <Route
            path="/ai/roadmap"
            element={<ProtectedRoute><AIRoadmap /></ProtectedRoute>}
          />
          <Route
            path="/ai/chat"
            element={<ProtectedRoute><AIChat /></ProtectedRoute>}
          />
          <Route
            path="/ai/skills"
            element={<ProtectedRoute><AISkillTracker /></ProtectedRoute>}
          />
          <Route
            path="/ai/quiz-generator"
            element={<AdminRoute><AIQuizGenerator /></AdminRoute>}
          />
          <Route
            path="/courses/:slug/forum"
            element={<ProtectedRoute><CourseForum /></ProtectedRoute>}
          />
          <Route
            path="/study-rooms"
            element={<ProtectedRoute><StudyRooms /></ProtectedRoute>}
          />
          <Route
            path="/leaderboard"
            element={<ProtectedRoute><Leaderboard /></ProtectedRoute>}
          />
          <Route
            path="/notes"
            element={<ProtectedRoute><MyNotes /></ProtectedRoute>}
          />
          <Route
            path="/peer-review"
            element={<ProtectedRoute><PeerReview /></ProtectedRoute>}
          />
          <Route
            path="/challenges"
            element={<ProtectedRoute><Challenges /></ProtectedRoute>}
          />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route
            path="/library"
            element={<ProtectedRoute><Library /></ProtectedRoute>}
          />
          <Route
            path="/mentorship"
            element={<ProtectedRoute><Mentorship /></ProtectedRoute>}
          />
          <Route
            path="/instructor/mentorship"
            element={<AdminRoute><InstructorMentorship /></AdminRoute>}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
