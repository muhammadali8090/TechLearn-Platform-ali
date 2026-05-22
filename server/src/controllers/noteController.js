import Note from '../models/Note.js';

export const getNotes = async (req, res, next) => {
  try {
    const { lessonId } = req.query;
    const filter = { userId: req.user._id };
    if (lessonId) filter.lessonId = lessonId;

    const notes = await Note.find(filter)
      .populate('lessonId', 'title')
      .populate('courseId', 'title slug')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
};

export const upsertNote = async (req, res, next) => {
  try {
    const { lessonId, courseId, content, highlights } = req.body;
    if (!lessonId || !courseId) {
      return res.status(400).json({ success: false, error: 'lessonId and courseId are required', statusCode: 400 });
    }

    const note = await Note.findOneAndUpdate(
      { userId: req.user._id, lessonId },
      { $set: { courseId, content: content || '', highlights: highlights || [] } },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ success: false, error: 'Note not found', statusCode: 404 });
    await note.deleteOne();
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
