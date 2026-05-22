import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['lesson_complete', 'quiz_passed', 'challenge_passed', 'exam_passed', 'certificate_earned', 'enrolled', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
