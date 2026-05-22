import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctIndex: { type: Number, required: true },
  explanation: { type: String, default: '' },
});

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, enum: ['pdf', 'link', 'zip'], default: 'link' },
  fileSize: { type: String, default: '' },
  downloadCount: { type: Number, default: 0 },
});

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, required: true },
    videoUrl: { type: String, default: '' },
    resources: [resourceSchema],
    quiz: {
      questions: [questionSchema],
    },
    codingChallenge: {
      prompt: { type: String, default: '' },
      starterCode: { type: String, default: '' },
      language: { type: String, default: 'javascript' },
      solution: { type: String, default: '' },
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    duration: { type: Number, default: 10 },
  },
  { timestamps: true }
);

export default mongoose.model('Lesson', lessonSchema);
