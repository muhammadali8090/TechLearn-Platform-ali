import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-6xl font-extrabold text-slate-900 mb-4">404</h1>
        <p className="text-xl text-slate-500 mb-8">Page not found</p>
        <Link
          to="/"
          className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold px-8 py-3 rounded-xl hover:opacity-90"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
