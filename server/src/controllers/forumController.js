import ForumPost from '../models/ForumPost.js';
import Course from '../models/Course.js';
import { awardXP } from '../utils/awardXP.js';

export const getForumPosts = async (req, res, next) => {
  try {
    const { id: courseId } = req.params;
    const posts = await ForumPost.find({ courseId, parentId: null })
      .populate('authorId', 'name avatar')
      .sort({ createdAt: -1 });

    // For each top-level post, fetch replies
    const postsWithReplies = await Promise.all(
      posts.map(async (post) => {
        const replies = await ForumPost.find({ parentId: post._id })
          .populate('authorId', 'name avatar')
          .sort({ createdAt: 1 });
        return { ...post.toObject(), replies };
      })
    );

    res.json({ success: true, data: postsWithReplies });
  } catch (err) {
    next(err);
  }
};

export const createForumPost = async (req, res, next) => {
  try {
    const { id: courseId } = req.params;
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: 'Content is required', statusCode: 400 });
    }

    const post = await ForumPost.create({
      courseId,
      authorId: req.user._id,
      content: content.trim(),
    });

    await awardXP(req.user._id, 'forum_post', courseId);

    const populated = await ForumPost.findById(post._id).populate('authorId', 'name avatar');
    res.status(201).json({ success: true, data: { ...populated.toObject(), replies: [] } });
  } catch (err) {
    next(err);
  }
};

export const replyToPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: 'Content is required', statusCode: 400 });
    }

    const parent = await ForumPost.findById(postId);
    if (!parent) return res.status(404).json({ success: false, error: 'Post not found', statusCode: 404 });

    const reply = await ForumPost.create({
      courseId: parent.courseId,
      authorId: req.user._id,
      parentId: postId,
      content: content.trim(),
    });

    const populated = await ForumPost.findById(reply._id).populate('authorId', 'name avatar');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const upvotePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await ForumPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found', statusCode: 404 });

    const userId = req.user._id.toString();
    const alreadyUpvoted = post.upvotes.some((id) => id.toString() === userId);

    if (alreadyUpvoted) {
      post.upvotes = post.upvotes.filter((id) => id.toString() !== userId);
    } else {
      post.upvotes.push(req.user._id);
    }
    await post.save();
    res.json({ success: true, data: { upvotes: post.upvotes.length, upvoted: !alreadyUpvoted } });
  } catch (err) {
    next(err);
  }
};
