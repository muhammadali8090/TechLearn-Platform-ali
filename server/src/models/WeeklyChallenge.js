import mongoose from 'mongoose';

const challengeSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true },
    passed: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const weeklyChallengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    starterCode: { type: String, default: '' },
    testCases: [{ input: String, expectedOutput: String }],
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    deadline: { type: Date, required: true },
    submissions: [challengeSubmissionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('WeeklyChallenge', weeklyChallengeSchema);
