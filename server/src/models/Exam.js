import mongoose from 'mongoose';

const examQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctIndex: { type: Number, required: true },
  explanation: { type: String, default: '' },
});

const examSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    questions: [examQuestionSchema],
    passingScore: { type: Number, default: 70 },
    timeLimit: { type: Number, default: 30 },
  },
  { timestamps: true }
);

export default mongoose.model('Exam', examSchema);
