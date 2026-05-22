import mongoose from 'mongoose';

const examAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    answers: [
      {
        questionIndex: { type: Number },
        selectedIndex: { type: Number },
      },
    ],
    score: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('ExamAttempt', examAttemptSchema);
