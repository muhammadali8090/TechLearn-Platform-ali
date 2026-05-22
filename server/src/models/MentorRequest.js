import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const mentorRequestSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    goalStatement: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'active', 'closed'], default: 'pending' },
    messages: [messageSchema],
  },
  { timestamps: true }
);

export default mongoose.model('MentorRequest', mentorRequestSchema);
