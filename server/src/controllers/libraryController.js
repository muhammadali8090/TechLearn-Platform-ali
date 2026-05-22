import SavedResource from '../models/SavedResource.js';

export const getLibrary = async (req, res, next) => {
  try {
    const resources = await SavedResource.find({ userId: req.user._id })
      .populate('courseId', 'title slug thumbnail')
      .populate('lessonId', 'title')
      .sort({ createdAt: -1 });

    // Group by course
    const grouped = {};
    resources.forEach((r) => {
      const courseKey = r.courseId?._id?.toString() || 'unknown';
      if (!grouped[courseKey]) {
        grouped[courseKey] = {
          course: r.courseId,
          resources: [],
        };
      }
      grouped[courseKey].resources.push(r);
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (err) {
    next(err);
  }
};

export const saveResource = async (req, res, next) => {
  try {
    const { courseId, lessonId, resourceIndex, resourceName, url } = req.body;
    if (!courseId || !lessonId || resourceIndex === undefined || !resourceName || !url) {
      return res.status(400).json({ success: false, error: 'All fields required', statusCode: 400 });
    }

    const saved = await SavedResource.findOneAndUpdate(
      { userId: req.user._id, lessonId, resourceIndex },
      { $set: { courseId, resourceName, url } },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
};

export const unsaveResource = async (req, res, next) => {
  try {
    const { lessonId, resourceIndex } = req.body;
    await SavedResource.findOneAndDelete({
      userId: req.user._id,
      lessonId,
      resourceIndex,
    });
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
