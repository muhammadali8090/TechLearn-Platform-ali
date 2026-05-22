import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLessons: [
      {
        lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
        completedAt: { type: Date, default: Date.now },
      },
    ],
    quizResults: [
      {
        lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
        score: { type: Number },
        attemptedAt: { type: Date, default: Date.now },
      },
    ],
    codingResults: [
      {
        lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
        passed: { type: Boolean },
        submittedAt: { type: Date, default: Date.now },
      },
    ],
    overallPercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Progress', progressSchema);
