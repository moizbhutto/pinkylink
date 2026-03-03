const Comment      = require('../models/Comment');
const Post         = require('../models/Post');
const Notification = require('../models/Notification');

// ─── @route  POST /api/comments/:postId ───────────────────────────────────────
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const comment = await Comment.create({
      post:   post._id,
      author: req.user._id,
      text:   text.trim(),
    });

    // Add comment ref to post
    post.comments.push(comment._id);
    await post.save();

    await comment.populate('author', '_id username avatar fullName');

    // Notify post author
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender:    req.user._id,
        type:      'comment',
        post:      post._id,
        comment:   comment._id,
        message:   `${req.user.username} commented: "${text.slice(0, 50)}"`,
      });
    }

    res.status(201).json({ success: true, comment });
  } catch (err) {
    console.error('Comment Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── @route  DELETE /api/comments/:commentId ──────────────────────────────────
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Remove from post
    await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });
    await comment.deleteOne();

    res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── @route  GET /api/comments/:postId ────────────────────────────────────────
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .populate('author', '_id username avatar fullName');

    res.json({ success: true, comments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { addComment, deleteComment, getComments };
