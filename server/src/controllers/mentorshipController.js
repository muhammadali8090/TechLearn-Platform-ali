import MentorRequest from '../models/MentorRequest.js';
import User from '../models/User.js';

export const getMentors = async (req, res, next) => {
  try {
    const mentors = await User.find({ role: 'admin' }).select('name avatar bio skills');
    res.json({ success: true, data: mentors });
  } catch (err) {
    next(err);
  }
};

export const requestMentor = async (req, res, next) => {
  try {
    const { mentorId, goalStatement } = req.body;
    if (!mentorId) {
      return res.status(400).json({ success: false, error: 'mentorId is required', statusCode: 400 });
    }

    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'admin') {
      return res.status(404).json({ success: false, error: 'Mentor not found', statusCode: 404 });
    }

    const existing = await MentorRequest.findOne({
      studentId: req.user._id,
      mentorId,
      status: { $in: ['pending', 'active'] },
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Request already exists', statusCode: 400 });
    }

    const request = await MentorRequest.create({
      studentId: req.user._id,
      mentorId,
      goalStatement: goalStatement || '',
    });

    const populated = await MentorRequest.findById(request._id)
      .populate('studentId', 'name avatar')
      .populate('mentorId', 'name avatar');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const getMyMentorships = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin
      ? { mentorId: req.user._id }
      : { studentId: req.user._id };

    const requests = await MentorRequest.find(filter)
      .populate('studentId', 'name avatar')
      .populate('mentorId', 'name avatar')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required', statusCode: 400 });
    }

    const request = await MentorRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, error: 'Request not found', statusCode: 404 });

    const isParticipant =
      request.studentId.toString() === req.user._id.toString() ||
      request.mentorId.toString() === req.user._id.toString();
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Forbidden', statusCode: 403 });
    }

    request.messages.push({ senderId: req.user._id, content: content.trim() });
    await request.save();

    const populated = await MentorRequest.findById(request._id)
      .populate('studentId', 'name avatar')
      .populate('mentorId', 'name avatar')
      .populate('messages.senderId', 'name avatar');

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'active', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status', statusCode: 400 });
    }

    const request = await MentorRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, error: 'Request not found', statusCode: 404 });

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin only', statusCode: 403 });
    }

    request.status = status;
    await request.save();

    const populated = await MentorRequest.findById(request._id)
      .populate('studentId', 'name avatar')
      .populate('mentorId', 'name avatar');

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};
