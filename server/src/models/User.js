import mongoose from 'mongoose';

const enrolledCourseSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  enrolledAt: { type: Date, default: Date.now },
  lastAccessedAt: { type: Date, default: Date.now },
});

const certificateSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  issuedAt: { type: Date, default: Date.now },
  certificateId: { type: String, required: true },
});

const bookmarkSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  note: { type: String, default: '' },
  savedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    website: { type: String, default: '' },
    github: { type: String, default: '' },
    skills: [{ type: String }],
    isPublic: { type: Boolean, default: true },
    xp: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastStreakDate: { type: Date, default: null },
    enrolledCourses: [enrolledCourseSchema],
    certificates: [certificateSchema],
    bookmarks: [bookmarkSchema],
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
