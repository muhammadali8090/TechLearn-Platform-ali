import User from '../models/User.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';

export const addBookmark = async (req, res, next) => {
  try {
    const { courseId, lessonId, note = '' } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({ success: false, error: 'courseId and lessonId are required', statusCode: 400 });
    }

    const user = await User.findById(req.user._id);

    const alreadyBookmarked = user.bookmarks.some(
      (b) => b.courseId.toString() === courseId && b.lessonId.toString() === lessonId
    );

    if (alreadyBookmarked) {
      return res.status(400).json({ success: false, error: 'Already bookmarked', statusCode: 400 });
    }

    user.bookmarks.push({ courseId, lessonId, note, savedAt: new Date() });
    await user.save();

    const bookmark = user.bookmarks[user.bookmarks.length - 1];
    res.status(201).json({ success: true, data: bookmark });
  } catch (err) {
    next(err);
  }
};

export const removeBookmark = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const bookmarkIndex = user.bookmarks.findIndex(
      (b) => b._id.toString() === req.params.bookmarkId
    );

    if (bookmarkIndex === -1) {
      return res.status(404).json({ success: false, error: 'Bookmark not found', statusCode: 404 });
    }

    user.bookmarks.splice(bookmarkIndex, 1);
    await user.save();

    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

export const getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('bookmarks.courseId', 'title slug thumbnail')
      .populate('bookmarks.lessonId', 'title description order');

    const bookmarks = user.bookmarks.map((b) => ({
      _id: b._id,
      course: b.courseId,
      lesson: b.lessonId,
      note: b.note,
      savedAt: b.savedAt,
    }));

    // Sort newest first
    bookmarks.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    res.json({ success: true, data: bookmarks });
  } catch (err) {
    next(err);
  }
};
