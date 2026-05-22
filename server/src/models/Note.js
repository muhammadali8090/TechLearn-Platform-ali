import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    content: { type: String, default: '' },
    highlights: [{ text: String, color: { type: String, default: '#fde68a' } }],
  },
  { timestamps: true }
);

noteSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export default mongoose.model('Note', noteSchema);
