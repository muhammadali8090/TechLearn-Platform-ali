import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  order: { type: Number, required: true },
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    category: { type: String, default: 'General' },
    tags: [{ type: String }],
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    estimatedDuration: { type: Number, default: 0 },
    sections: [sectionSchema],
    finalExam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
    enrolledCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Course', courseSchema);
