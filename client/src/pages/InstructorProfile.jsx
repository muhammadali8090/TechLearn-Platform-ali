import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInstructor } from '../services/userService';
import CourseCard from '../components/CourseCard';
import Navbar from '../components/Navbar';

export default function InstructorProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInstructor(id)
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('Instructor not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="text-center py-20 text-slate-400">Instructor not found.</div>
    </div>
  );

  const { instructor, courses } = data;
  const initials = instructor.name?.split(' ').map((n) => n[0]).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/instructors" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            All Instructors
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold mb-1">{instructor.name}</h1>
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{courses.length} courses</span>
                <span>•</span>
                <span>Member since {new Date(instructor.createdAt).getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">About</h2>
              <p className="text-slate-600 leading-relaxed">{instructor.bio || 'Experienced instructor passionate about teaching.'}</p>
            </div>
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Courses by {instructor.name}</h2>
            {courses.length === 0 ? (
              <p className="text-slate-400">No published courses yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
