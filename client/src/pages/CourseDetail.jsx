import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Users, BookOpen, BarChart3, ChevronDown, ChevronRight, Lock, Play, Award, MessageSquare, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCourseBySlug, enrollCourse } from '../services/courseService';
import { getCourseReviews, createReview } from '../services/reviewService';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const levelColors = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

export default function CourseDetail() {
  const { slug } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [openSections, setOpenSections] = useState({});
  const [enrolling, setEnrolling] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsData, setReviewsData] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    getCourseBySlug(slug)
      .then((r) => {
        setCourse(r.data.data);
        return getCourseReviews(r.data.data._id);
      })
      .then((r) => {
        setReviewsData(r.data.data);
        setReviews(r.data.data.reviews || []);
      })
      .catch(() => toast.error('Course not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmitReview = async () => {
    if (!myRating) { toast.error('Please select a rating'); return; }
    setSubmittingReview(true);
    try {
      const r = await createReview(course._id, { rating: myRating, comment: myComment });
      setReviews((prev) => {
        const exists = prev.findIndex((rv) => rv.userId?._id === user?._id);
        if (exists >= 0) { const updated = [...prev]; updated[exists] = r.data.data; return updated; }
        return [r.data.data, ...prev];
      });
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isEnrolled = user?.enrolledCourses?.some((e) => {
    const id = e.courseId?._id || e.courseId;
    return id?.toString() === course?._id?.toString();
  });

  const totalLessons = course?.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
  const hours = course?.estimatedDuration ? Math.floor(course.estimatedDuration / 60) : 0;
  const mins = course?.estimatedDuration ? course.estimatedDuration % 60 : 0;

  const handleEnroll = async () => {
    if (!user) { toast.error('Please sign in to enroll'); navigate('/auth'); return; }
    setEnrolling(true);
    try {
      await enrollCourse(course._id);
      await refreshUser();
      toast.success('Enrolled successfully!');
      navigate(`/learn/${course.slug}`);
    } catch (err) {
      const msg = err.response?.data?.error;
      if (msg === 'Already enrolled') navigate(`/learn/${course.slug}`);
      else toast.error(msg || 'Enroll failed');
    } finally {
      setEnrolling(false);
    }
  };

  const toggleSection = (idx) => setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!course) return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="text-center py-20"><p className="text-slate-500">Course not found.</p></div>
    </div>
  );

  const instructorInitials = course.instructor?.name?.split(' ').map((n) => n[0]).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${levelColors[course.level]}`}>
                  {course.level?.charAt(0).toUpperCase() + course.level?.slice(1)}
                </span>
                <span className="text-xs text-slate-400">{course.category}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{course.title}</h1>
              <p className="text-slate-300 text-lg mb-6">{course.description}</p>

              {course.instructor && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                    {instructorInitials}
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Instructor</p>
                    <Link to={`/instructors/${course.instructor._id}`} className="font-semibold hover:text-indigo-300 transition-colors">
                      {course.instructor.name}
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-6 text-sm text-slate-300">
                <span className="flex items-center gap-2"><Users className="w-4 h-4" />{course.enrolledCount || 0} students</span>
                <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" />{totalLessons} lessons</span>
                <span className="flex items-center gap-2"><Clock className="w-4 h-4" />{hours > 0 ? `${hours}h ` : ''}{mins}m</span>
                <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" />{course.level}</span>
              </div>
            </div>

            {/* Enrollment Card */}
            <div className="bg-white rounded-2xl p-6 text-slate-900 shadow-xl">
              <img
                src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80'}
                alt={course.title}
                className="w-full h-40 object-cover rounded-xl mb-4"
              />
              <div className="text-center mb-4">
                <span className="text-2xl font-extrabold text-indigo-600">Free</span>
                <p className="text-sm text-slate-500">Full access, no payment needed</p>
              </div>
              {isEnrolled ? (
                <Link
                  to={`/learn/${course.slug}`}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Play className="w-4 h-4" />
                  Continue Learning
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now — Free'}
                </button>
              )}
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500">
                <Award className="w-4 h-4 text-amber-500" />
                Certificate on completion
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {['overview', 'curriculum', 'instructor', 'reviews', 'forum'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-6 py-4 font-semibold text-sm capitalize transition-colors whitespace-nowrap ${activeTab === t ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t === 'reviews' ? `Reviews${reviews.length > 0 ? ` (${reviews.length})` : ''}` : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'overview' && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">About this course</h2>
            <p className="text-slate-600 leading-relaxed text-lg mb-8">{course.description}</p>
            {course.tags?.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-800 mb-3">Topics covered</h3>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag) => (
                    <span key={tag} className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-lg font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {course.finalExam && (
              <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-6 h-6 text-amber-600" />
                  <h3 className="font-bold text-amber-800">Final Exam & Certificate</h3>
                </div>
                <p className="text-amber-700 text-sm">
                  Complete all lessons to unlock the final exam. Pass with 70%+ to earn your certificate.
                </p>
                {isEnrolled && (
                  <Link
                    to={`/exam/${course._id}`}
                    className="inline-flex items-center gap-2 mt-3 bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors"
                  >
                    Take Final Exam
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="max-w-3xl space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Course Curriculum</h2>
            {course.sections?.sort((a, b) => a.order - b.order).map((section, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => toggleSection(idx)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">{section.title}</span>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {section.lessons?.length || 0} lessons
                    </span>
                  </div>
                  {openSections[idx] ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                </button>
                {openSections[idx] && (
                  <div className="border-t border-slate-100">
                    {section.lessons?.map((lesson, lIdx) => (
                      <div key={lIdx} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                        {isEnrolled ? (
                          <Play className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${isEnrolled ? 'text-slate-700' : 'text-slate-400'}`}>
                          {lesson.title}
                        </span>
                        {lesson.duration && (
                          <span className="ml-auto text-xs text-slate-400">{lesson.duration}m</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Student Reviews</h2>
            {reviewsData && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-5xl font-extrabold text-slate-900">{reviewsData.avg || '—'}</div>
                    <div className="flex gap-0.5 justify-center mt-1">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(reviewsData.avg) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{reviewsData.total} reviews</p>
                  </div>
                  <div className="flex-1">
                    {[5,4,3,2,1].map((star) => (
                      <div key={star} className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500 w-3">{star}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: reviewsData.total > 0 ? `${((reviewsData.histogram?.[star] || 0) / reviewsData.total) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-5">{reviewsData.histogram?.[star] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {isEnrolled && user && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
                <h3 className="font-semibold text-slate-800 mb-3">Leave a Review</h3>
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => (
                    <button key={s} onClick={() => setMyRating(s)} className="transition-transform hover:scale-110">
                      <Star className={`w-6 h-6 ${s <= myRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={myComment} onChange={(e) => setMyComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="mt-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {review.userId?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-800 text-sm">{review.userId?.name}</span>
                          <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                        {review.comment && <p className="text-sm text-slate-600">{review.comment}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'forum' && course && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <MessageSquare className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 mb-2">Course Discussion Forum</h3>
              <p className="text-slate-500 text-sm mb-4">Ask questions and connect with other students in this course.</p>
              <Link
                to={`/courses/${slug}/forum`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <MessageSquare className="w-4 h-4" /> Open Forum
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'instructor' && course.instructor && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl p-8 border border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold">
                  {instructorInitials}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{course.instructor.name}</h2>
                  <Link to={`/instructors/${course.instructor._id}`} className="text-indigo-600 text-sm font-medium hover:underline">
                    View full profile
                  </Link>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed">{course.instructor.bio || 'Experienced instructor passionate about teaching.'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
