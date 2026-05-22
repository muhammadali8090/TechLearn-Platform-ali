import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, ChevronUp, Save, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCourse, updateCourse, publishCourse, createExam } from '../services/courseService';
import { getAdminCourses } from '../services/userService';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const emptyQuestion = () => ({ question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' });
const emptyLesson = () => ({ title: '', description: '', order: 0, videoUrl: '', duration: 10, quiz: { questions: [] }, codingChallenge: { prompt: '', starterCode: '', language: 'javascript', solution: '' }, resources: [] });
const emptySection = () => ({ title: '', order: 0, lessons: [emptyLesson()], _open: true });

export default function CourseBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [courseId, setCourseId] = useState(id || null);

  const [basicInfo, setBasicInfo] = useState({
    title: '', description: '', category: 'Web Dev', level: 'beginner',
    thumbnail: '', estimatedDuration: 60,
  });

  const [sections, setSections] = useState([emptySection()]);

  const [examData, setExamData] = useState({
    passingScore: 70, timeLimit: 30,
    questions: [emptyQuestion()],
  });

  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (isEdit) {
      getAdminCourses().then((r) => {
        const c = (r.data.data || []).find((c) => c._id === id);
        if (c) {
          setBasicInfo({
            title: c.title, description: c.description, category: c.category,
            level: c.level, thumbnail: c.thumbnail, estimatedDuration: c.estimatedDuration,
          });
          setPublished(c.status === 'published');
          if (c.sections?.length > 0) setSections(c.sections.map((s) => ({ ...s, _open: false })));
        }
      }).catch(() => {});
    }
  }, [id, isEdit]);

  const saveBasicInfo = async () => {
    if (!basicInfo.title) return toast.error('Title is required');
    setSaving(true);
    try {
      if (courseId) {
        await updateCourse(courseId, basicInfo);
        toast.success('Course updated');
      } else {
        const res = await createCourse(basicInfo);
        setCourseId(res.data.data._id);
        toast.success('Course created');
      }
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveSections = async () => {
    if (!courseId) return toast.error('Save basic info first');
    setSaving(true);
    try {
      // Build sections with lesson details
      const cleanSections = await Promise.all(sections.map(async (section, sIdx) => {
        const lessonIds = [];
        for (const lesson of section.lessons) {
          if (lesson._id) {
            await api.put(`/courses/${courseId}/lessons/${lesson._id}`, lesson).catch(() => {});
            lessonIds.push(lesson._id);
          } else {
            const res = await api.post(`/courses/${courseId}/sections/${sIdx}/lessons`, lesson).catch(() => null);
            if (res) lessonIds.push(res.data.data._id);
          }
        }
        return { title: section.title, order: sIdx, lessons: lessonIds };
      }));
      await updateCourse(courseId, { sections: cleanSections });
      toast.success('Sections saved');
      setStep(2);
    } catch {
      toast.error('Failed to save sections');
    } finally {
      setSaving(false);
    }
  };

  const saveExam = async () => {
    if (!courseId) return toast.error('Save basic info first');
    setSaving(true);
    try {
      await createExam(courseId, examData);
      toast.success('Exam saved');
      setStep(3);
    } catch {
      toast.error('Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!courseId) return;
    setSaving(true);
    try {
      await publishCourse(courseId);
      setPublished(true);
      toast.success('Course published!');
      navigate('/admin');
    } catch {
      toast.error('Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  const steps = ['Basic Info', 'Sections & Lessons', 'Final Exam', 'Publish'];

  // Section helpers
  const addSection = () => setSections([...sections, { ...emptySection(), order: sections.length }]);
  const removeSection = (i) => setSections(sections.filter((_, idx) => idx !== i));
  const updateSection = (i, key, val) => setSections(sections.map((s, idx) => idx === i ? { ...s, [key]: val } : s));
  const toggleSection = (i) => setSections(sections.map((s, idx) => idx === i ? { ...s, _open: !s._open } : s));

  // Lesson helpers
  const addLesson = (si) => setSections(sections.map((s, i) => i === si ? { ...s, lessons: [...s.lessons, emptyLesson()] } : s));
  const removeLesson = (si, li) => setSections(sections.map((s, i) => i === si ? { ...s, lessons: s.lessons.filter((_, j) => j !== li) } : s));
  const updateLesson = (si, li, key, val) => setSections(sections.map((s, i) => i === si ? { ...s, lessons: s.lessons.map((l, j) => j === li ? { ...l, [key]: val } : l) } : s));

  // Quiz helpers
  const addQuestion = (si, li) => setSections(sections.map((s, i) => i === si ? {
    ...s, lessons: s.lessons.map((l, j) => j === li ? { ...l, quiz: { questions: [...(l.quiz?.questions || []), emptyQuestion()] } } : l)
  } : s));
  const removeQuestion = (si, li, qi) => setSections(sections.map((s, i) => i === si ? {
    ...s, lessons: s.lessons.map((l, j) => j === li ? { ...l, quiz: { questions: l.quiz.questions.filter((_, k) => k !== qi) } } : l)
  } : s));
  const updateQuestion = (si, li, qi, key, val) => setSections(sections.map((s, i) => i === si ? {
    ...s, lessons: s.lessons.map((l, j) => j === li ? { ...l, quiz: { questions: l.quiz.questions.map((q, k) => k === qi ? { ...q, [key]: val } : q) } } : l)
  } : s));

  // Exam question helpers
  const addExamQ = () => setExamData((e) => ({ ...e, questions: [...e.questions, emptyQuestion()] }));
  const removeExamQ = (i) => setExamData((e) => ({ ...e, questions: e.questions.filter((_, j) => j !== i) }));
  const updateExamQ = (i, key, val) => setExamData((e) => ({ ...e, questions: e.questions.map((q, j) => j === i ? { ...q, [key]: val } : q) }));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">{isEdit ? 'Edit Course' : 'Create New Course'}</h1>
          <p className="text-slate-500 mt-1">Build an engaging course for your students</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8 gap-0">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <button
                onClick={() => setStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${step === i ? 'bg-indigo-500 text-white' : i < step ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === i ? 'bg-white text-indigo-600' : i < step ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </span>
                <span className="hidden sm:block">{s}</span>
              </button>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-indigo-300' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-5">
            <h2 className="text-xl font-bold text-slate-900">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Title *</label>
              <input value={basicInfo.title} onChange={(e) => setBasicInfo({ ...basicInfo, title: e.target.value })}
                placeholder="e.g. JavaScript Fundamentals"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea value={basicInfo.description} onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                rows={4} placeholder="Describe what students will learn..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <select value={basicInfo.category} onChange={(e) => setBasicInfo({ ...basicInfo, category: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {['Web Dev', 'Data Science', 'Python', 'JavaScript', 'Mobile', 'DevOps', 'Other'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Level</label>
                <select value={basicInfo.level} onChange={(e) => setBasicInfo({ ...basicInfo, level: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Thumbnail URL</label>
                <input value={basicInfo.thumbnail} onChange={(e) => setBasicInfo({ ...basicInfo, thumbnail: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration (minutes)</label>
                <input type="number" value={basicInfo.estimatedDuration} onChange={(e) => setBasicInfo({ ...basicInfo, estimatedDuration: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
            <button onClick={saveBasicInfo} disabled={saving}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        )}

        {/* Step 1: Sections & Lessons */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Sections & Lessons</h2>
              <button onClick={addSection} className="flex items-center gap-2 text-indigo-600 font-semibold text-sm hover:text-indigo-700">
                <Plus className="w-4 h-4" /> Add Section
              </button>
            </div>

            {sections.map((section, si) => (
              <div key={si} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-100">
                  <button onClick={() => toggleSection(si)} className="text-slate-400">
                    {section._open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <input
                    value={section.title}
                    onChange={(e) => updateSection(si, 'title', e.target.value)}
                    placeholder={`Section ${si + 1} title`}
                    className="flex-1 bg-transparent font-semibold text-slate-800 focus:outline-none"
                  />
                  <button onClick={() => removeSection(si)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {section._open && (
                  <div className="p-4 space-y-4">
                    {section.lessons.map((lesson, li) => (
                      <div key={li} className="border border-slate-100 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700 text-sm">Lesson {li + 1}</span>
                          <button onClick={() => removeLesson(si, li)} className="text-red-400 hover:text-red-600 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input value={lesson.title} onChange={(e) => updateLesson(si, li, 'title', e.target.value)}
                          placeholder="Lesson title" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        <input value={lesson.videoUrl} onChange={(e) => updateLesson(si, li, 'videoUrl', e.target.value)}
                          placeholder="Video URL (YouTube embed)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        <textarea value={lesson.description} onChange={(e) => updateLesson(si, li, 'description', e.target.value)}
                          placeholder="Lesson description" rows={2}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">Duration (min):</label>
                          <input type="number" value={lesson.duration} onChange={(e) => updateLesson(si, li, 'duration', parseInt(e.target.value) || 10)}
                            className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>

                        {/* Quiz questions */}
                        <div className="border-t border-slate-100 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Quiz Questions</span>
                            <button onClick={() => addQuestion(si, li)} className="text-xs text-indigo-600 font-medium hover:text-indigo-700">+ Add Question</button>
                          </div>
                          {lesson.quiz?.questions?.map((q, qi) => (
                            <div key={qi} className="bg-slate-50 rounded-lg p-3 mb-2 space-y-2">
                              <div className="flex items-start gap-2">
                                <input value={q.question} onChange={(e) => updateQuestion(si, li, qi, 'question', e.target.value)}
                                  placeholder="Question text" className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                                <button onClick={() => removeQuestion(si, li, qi)} className="text-red-400 p-1">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {q.options.map((opt, oi) => (
                                  <div key={oi} className="flex items-center gap-1.5">
                                    <input type="radio" name={`q-${si}-${li}-${qi}`} checked={q.correctIndex === oi}
                                      onChange={() => updateQuestion(si, li, qi, 'correctIndex', oi)} className="text-indigo-500" />
                                    <input value={opt} onChange={(e) => {
                                      const opts = [...q.options]; opts[oi] = e.target.value;
                                      updateQuestion(si, li, qi, 'options', opts);
                                    }} placeholder={`Option ${oi + 1}`}
                                      className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none" />
                                  </div>
                                ))}
                              </div>
                              <input value={q.explanation} onChange={(e) => updateQuestion(si, li, qi, 'explanation', e.target.value)}
                                placeholder="Explanation (optional)" className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addLesson(si)}
                      className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                      + Add Lesson
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50">
                Back
              </button>
              <button onClick={saveSections} disabled={saving}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Final Exam */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-5">
            <h2 className="text-xl font-bold text-slate-900">Final Exam</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Passing Score (%)</label>
                <input type="number" min={0} max={100} value={examData.passingScore}
                  onChange={(e) => setExamData({ ...examData, passingScore: parseInt(e.target.value) || 70 })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Time Limit (minutes)</label>
                <input type="number" min={1} value={examData.timeLimit}
                  onChange={(e) => setExamData({ ...examData, timeLimit: parseInt(e.target.value) || 30 })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Questions</h3>
                <button onClick={addExamQ} className="text-indigo-600 font-medium text-sm hover:text-indigo-700">+ Add Question</button>
              </div>
              <div className="space-y-4">
                {examData.questions.map((q, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-slate-500 mt-2">{i + 1}.</span>
                      <input value={q.question} onChange={(e) => updateExamQ(i, 'question', e.target.value)}
                        placeholder="Question" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                      <button onClick={() => removeExamQ(i)} className="text-red-400 p-1 mt-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-5">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input type="radio" name={`exam-q-${i}`} checked={q.correctIndex === oi}
                            onChange={() => updateExamQ(i, 'correctIndex', oi)} className="text-indigo-500" />
                          <input value={opt} onChange={(e) => {
                            const opts = [...q.options]; opts[oi] = e.target.value;
                            updateExamQ(i, 'options', opts);
                          }} placeholder={`Option ${oi + 1}`}
                            className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none" />
                        </div>
                      ))}
                    </div>
                    <input value={q.explanation} onChange={(e) => updateExamQ(i, 'explanation', e.target.value)}
                      placeholder="Explanation (optional)" className="w-full ml-5 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium">Back</button>
              <button onClick={saveExam} disabled={saving}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Publish */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to Publish!</h2>
              <p className="text-slate-500">Your course is complete. Publish it to make it available to students.</p>
            </div>
            {published ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-emerald-700 font-semibold">Course is published and live!</p>
              </div>
            ) : (
              <button onClick={handlePublish} disabled={saving}
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-white font-bold px-10 py-3 rounded-xl hover:opacity-90 disabled:opacity-60">
                {saving ? 'Publishing...' : 'Publish Course'}
              </button>
            )}
            <button onClick={() => setStep(0)} className="block mx-auto text-slate-500 text-sm hover:text-slate-700">Edit course</button>
          </div>
        )}
      </div>
    </div>
  );
}
