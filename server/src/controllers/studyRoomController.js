import StudyRoom from '../models/StudyRoom.js';

export const getStudyRooms = async (req, res, next) => {
  try {
    const rooms = await StudyRoom.find({ isActive: true })
      .populate('creatorId', 'name avatar')
      .populate('members', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
};

export const createStudyRoom = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Room name is required', statusCode: 400 });
    }
    const room = await StudyRoom.create({
      name: name.trim(),
      creatorId: req.user._id,
      members: [req.user._id],
    });
    const populated = await StudyRoom.findById(room._id)
      .populate('creatorId', 'name avatar')
      .populate('members', 'name avatar');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const deleteStudyRoom = async (req, res, next) => {
  try {
    const room = await StudyRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, error: 'Room not found', statusCode: 404 });
    if (room.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden', statusCode: 403 });
    }
    room.isActive = false;
    await room.save();
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

export const joinStudyRoom = async (req, res, next) => {
  try {
    const room = await StudyRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, error: 'Room not found', statusCode: 404 });
    const alreadyIn = room.members.some((m) => m.toString() === req.user._id.toString());
    if (!alreadyIn) room.members.push(req.user._id);
    await room.save();
    const populated = await StudyRoom.findById(room._id)
      .populate('creatorId', 'name avatar')
      .populate('members', 'name avatar');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const leaveStudyRoom = async (req, res, next) => {
  try {
    const room = await StudyRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, error: 'Room not found', statusCode: 404 });
    room.members = room.members.filter((m) => m.toString() !== req.user._id.toString());
    await room.save();
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

export const updateTimer = async (req, res, next) => {
  try {
    const { action } = req.body; // start | pause | reset
    const room = await StudyRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, error: 'Room not found', statusCode: 404 });

    if (action === 'start') {
      room.timerState.isPaused = false;
      room.timerState.startedAt = new Date();
    } else if (action === 'pause') {
      if (!room.timerState.isPaused && room.timerState.startedAt) {
        const elapsed = Math.floor((Date.now() - new Date(room.timerState.startedAt)) / 1000);
        room.timerState.elapsed = (room.timerState.elapsed || 0) + elapsed;
      }
      room.timerState.isPaused = true;
      room.timerState.startedAt = null;
    } else if (action === 'reset') {
      room.timerState.isPaused = true;
      room.timerState.startedAt = null;
      room.timerState.elapsed = 0;
      room.timerState.mode = 'work';
    } else if (action === 'switchMode') {
      room.timerState.mode = room.timerState.mode === 'work' ? 'break' : 'work';
      room.timerState.elapsed = 0;
      room.timerState.isPaused = true;
      room.timerState.startedAt = null;
    }

    await room.save();
    const populated = await StudyRoom.findById(room._id)
      .populate('creatorId', 'name avatar')
      .populate('members', 'name avatar');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};
