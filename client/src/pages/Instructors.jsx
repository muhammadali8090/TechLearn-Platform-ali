import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { getInstructors } from '../services/userService';
import Navbar from '../components/Navbar';

export default function Instructors() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInstructors()
      .then((r) => setInstructors(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold mb-2">Our Instructors</h1>
          <p className="text-indigo-100">Learn from experienced professionals</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-56 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructors.map((inst) => {
              const initials = inst.name?.split(' ').map((n) => n[0]).join('').toUpperCase();
              return (
                <Link
                  key={inst._id}
                  to={`/instructors/${inst._id}`}
                  className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-5">
                    {initials}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 text-center group-hover:text-indigo-600 transition-colors mb-2">
                    {inst.name}
                  </h3>
                  <p className="text-sm text-slate-500 text-center line-clamp-3 mb-4">{inst.bio || 'Experienced instructor'}</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-indigo-600 font-semibold">
                    <BookOpen className="w-4 h-4" />
                    {inst.courseCount || 0} courses
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && instructors.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400">No instructors found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
