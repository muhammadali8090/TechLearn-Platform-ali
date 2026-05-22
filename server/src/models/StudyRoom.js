import mongoose from 'mongoose';

const timerStateSchema = new mongoose.Schema({
  mode: { type: String, enum: ['work', 'break'], default: 'work' },
  startedAt: { type: Date, default: null },
  isPaused: { type: Boolean, default: true },
  elapsed: { type: Number, default: 0 },
}, { _id: false });

const studyRoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    timerState: { type: timerStateSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('StudyRoom', studyRoomSchema);
