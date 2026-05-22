import mongoose from 'mongoose';

const xpEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['lesson_complete', 'quiz_passed', 'course_complete', 'streak_day', 'forum_post'],
      required: true,
    },
    points: { type: Number, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('XPEvent', xpEventSchema);
