import mongoose from 'mongoose';

const savedResourceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    resourceIndex: { type: Number, required: true },
    resourceName: { type: String, required: true },
    url: { type: String, required: true },
  },
  { timestamps: true }
);

savedResourceSchema.index({ userId: 1, lessonId: 1, resourceIndex: 1 }, { unique: true });

export default mongoose.model('SavedResource', savedResourceSchema);
