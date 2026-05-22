import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true }
);

const codeSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    code: { type: String, required: true },
    language: { type: String, default: 'javascript' },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

export default mongoose.model('CodeSubmission', codeSubmissionSchema);
