import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ThumbsUp, Send, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getForumPosts, createForumPost, replyToPost, upvotePost } from '../services/forumService';
import { getCourseBySlug } from '../services/courseService';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Avatar({ name, size = 8 }) {
  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
      {initials}
    </div>
  );
}

function PostCard({ post, onUpvote, onReply, currentUserId }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyOpen, setReplyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const upvoted = post.upvotes?.some((id) => id === currentUserId || id?._id === currentUserId);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(post._id, replyText.trim());
      setReplyText('');
      setReplyOpen(false);
      setShowReplies(true);
    } catch {
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
    >
      <div className="flex gap-3">
        <Avatar name={post.authorId?.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{post.authorId?.name}</span>
            <span className="text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{post.content}</p>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => onUpvote(post._id)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                upvoted
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              {post.upvotes?.length || 0}
            </button>
            <button
              onClick={() => setReplyOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Reply
            </button>
            {post.replies?.length > 0 && (
              <button
                onClick={() => setShowReplies((v) => !v)}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          <AnimatePresence>
            {replyOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    onClick={handleReply}
                    disabled={submitting || !replyText.trim()}
                    className="px-3 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors self-end"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showReplies && post.replies?.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 space-y-3 pl-4 border-l-2 border-indigo-100 dark:border-indigo-900/40"
              >
                {post.replies.map((reply) => (
                  <div key={reply._id} className="flex gap-2.5">
                    <Avatar name={reply.authorId?.name} size={7} />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{reply.authorId?.name}</span>
                        <span className="text-xs text-slate-400">{timeAgo(reply.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function CourseForum() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCourseBySlug(slug)
      .then((r) => {
        setCourse(r.data.data);
        return getForumPosts(r.data.data._id);
      })
      .then((r) => setPosts(r.data.data))
      .catch(() => toast.error('Failed to load forum'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setSubmitting(true);
    try {
      const r = await createForumPost(course._id, newPost.trim());
      setPosts((prev) => [r.data.data, ...prev]);
      setNewPost('');
      toast.success('Posted!');
    } catch {
      toast.error('Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (postId) => {
    try {
      await upvotePost(postId);
      setPosts((prev) => prev.map((p) => {
        if (p._id !== postId) return p;
        const alreadyUpvoted = p.upvotes?.some((id) => id === user._id || id?._id === user._id);
        return {
          ...p,
          upvotes: alreadyUpvoted
            ? p.upvotes.filter((id) => (id?._id || id) !== user._id)
            : [...(p.upvotes || []), user._id],
        };
      }));
    } catch {
      toast.error('Failed to upvote');
    }
  };

  const handleReply = async (postId, content) => {
    const r = await replyToPost(postId, content);
    setPosts((prev) => prev.map((p) => p._id === postId
      ? { ...p, replies: [...(p.replies || []), r.data.data] }
      : p
    ));
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary,#F8FAFC)] dark:bg-slate-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link
            to={`/courses/${slug}`}
            className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Back to course
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {course?.title} — Discussion Forum
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ask questions, share insights, and help fellow students.</p>
        </div>

        {/* New Post */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-6"
          >
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Ask a question or share something with your classmates..."
              rows={3}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handlePost}
                disabled={submitting || !newPost.trim()}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No posts yet. Be the first to ask!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onUpvote={handleUpvote}
                onReply={handleReply}
                currentUserId={user?._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
