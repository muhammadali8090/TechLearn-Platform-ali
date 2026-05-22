import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Award, Plus, Edit, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminCourses, getAdminUsers } from '../services/userService';
import { deleteCourse, publishCourse } from '../services/courseService';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, usersRes] = await Promise.all([getAdminCourses(), getAdminUsers()]);
      setCourses(coursesRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c._id !== id));
      toast.success('Course deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handlePublish = async (id) => {
    try {
      await publishCourse(id);
      setCourses((prev) => prev.map((c) => c._id === id ? { ...c, status: 'published' } : c));
      toast.success('Course published!');
    } catch {
      toast.error('Failed to publish');
    }
  };

  const publishedCount = courses.filter((c) => c.status === 'published').length;
  const draftCount = courses.filter((c) => c.status === 'draft').length;
  const studentCount = users.filter((u) => u.role === 'student').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500">Manage courses and users</p>
          </div>
          <Link
            to="/admin/courses/new"
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            New Course
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <BookOpen className="w-6 h-6 text-indigo-500 mb-2" />
            <p className="text-2xl font-extrabold text-slate-900">{courses.length}</p>
            <p className="text-sm text-slate-500">Total Courses</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <CheckCircle className="w-6 h-6 text-emerald-500 mb-2" />
            <p className="text-2xl font-extrabold text-slate-900">{publishedCount}</p>
            <p className="text-sm text-slate-500">Published</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <XCircle className="w-6 h-6 text-amber-500 mb-2" />
            <p className="text-2xl font-extrabold text-slate-900">{draftCount}</p>
            <p className="text-sm text-slate-500">Drafts</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <Users className="w-6 h-6 text-violet-500 mb-2" />
            <p className="text-2xl font-extrabold text-slate-900">{studentCount}</p>
            <p className="text-sm text-slate-500">Students</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
          {['courses', 'users'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2 rounded-lg font-semibold text-sm capitalize transition-colors ${activeTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl h-64 animate-pulse" />
        ) : activeTab === 'courses' ? (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Level</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Students</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {courses.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 max-w-xs truncate">{c.title}</p>
                        <p className="text-xs text-slate-400">{c.instructor?.name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{c.category}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 capitalize">{c.level}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{c.enrolledCount || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {c.status === 'draft' && (
                            <button onClick={() => handlePublish(c._id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Publish">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <Link to={`/courses/${c.slug}`} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link to={`/admin/courses/${c._id}/edit`} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(c._id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No courses yet. <Link to="/admin/courses/new" className="text-indigo-600 font-medium">Create one</Link></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">{u.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{u.enrolledCourses?.length || 0}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
