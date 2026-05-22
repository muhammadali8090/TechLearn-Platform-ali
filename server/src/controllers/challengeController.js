import WeeklyChallenge from '../models/WeeklyChallenge.js';

export const getChallenges = async (req, res, next) => {
  try {
    const challenges = await WeeklyChallenge.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: challenges });
  } catch (err) {
    next(err);
  }
};

export const createChallenge = async (req, res, next) => {
  try {
    const { title, description, starterCode, testCases, difficulty, deadline } = req.body;
    if (!title || !description || !deadline) {
      return res.status(400).json({ success: false, error: 'title, description, deadline required', statusCode: 400 });
    }
    const challenge = await WeeklyChallenge.create({
      title,
      description,
      starterCode: starterCode || '',
      testCases: testCases || [],
      difficulty: difficulty || 'medium',
      deadline: new Date(deadline),
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
};

export const getChallengeById = async (req, res, next) => {
  try {
    const challenge = await WeeklyChallenge.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('submissions.userId', 'name avatar');
    if (!challenge) return res.status(404).json({ success: false, error: 'Challenge not found', statusCode: 404 });
    res.json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
};

export const submitChallenge = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Code is required', statusCode: 400 });

    const challenge = await WeeklyChallenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ success: false, error: 'Challenge not found', statusCode: 404 });

    if (new Date() > new Date(challenge.deadline)) {
      return res.status(400).json({ success: false, error: 'Challenge deadline has passed', statusCode: 400 });
    }

    const existingIdx = challenge.submissions.findIndex(
      (s) => s.userId.toString() === req.user._id.toString()
    );

    const submissionData = { userId: req.user._id, code, passed: true, submittedAt: new Date() };

    if (existingIdx >= 0) {
      challenge.submissions[existingIdx] = { ...challenge.submissions[existingIdx].toObject(), ...submissionData };
    } else {
      challenge.submissions.push(submissionData);
    }

    await challenge.save();
    res.json({ success: true, data: { message: 'Submitted successfully' } });
  } catch (err) {
    next(err);
  }
};
