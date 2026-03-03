const Post         = require('../models/Post');
const Comment      = require('../models/Comment');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const { cloudinary } = require('../config/cloudinary');

// ─── @route  POST /api/posts ───────────────────────────────────────────────────
const createPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image is required.' });
    }

    const { caption, location } = req.body;

    // Extract hashtags from caption
    const tags = caption?.match(/#\w+/g)?.map(t => t.slice(1).toLowerCase()) || [];

    const post = await Post.create({
      author:   req.user._id,
      image:    { url: req.file.path, publicId: req.file.filename },
      caption:  caption || '',
      location: location || '',
      tags,
    });

    await post.populate('author', '_id username avatar fullName');

    res.status(201).json({ success: true, message: 'Post created!', post });
  } catch (err) {
    console.error('Create Post Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── @route  GET /api/posts/feed ──────────────────────────────────────────────
const getFeed = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // Get posts from followed users + own posts
    const followingIds = [...req.user.following, req.user._id];

    const posts = await Post.find({ author: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author',   '_id username avatar fullName')
      .populate({
        path:    'comments',
        options: { sort: { createdAt: -1 }, limit: 2 },
        populate: { path: 'author', select: '_id username avatar' },
      });

    const total    = await Post.countDocuments({ author: { $in: followingIds } });
    const hasMore  = skip + posts.length < total;

    res.json({ success: true, posts, hasMore, page, total });
  } catch (err) {
    console.error('Feed Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── @route  GET /api/posts/explore ───────────────────────────────────────────
const getExplorePosts = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip  = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ likes: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', '_id username avatar fullName')
      .select('image likes comments author createdAt caption');

    const total   = await Post.countDocuments();
    const hasMore = skip + posts.length < total;

    res.json({ success: true, posts, hasMore });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── @route  GET /api/posts/:id ───────────────────────────────────────────────
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', '_id username avatar fullName')
      .populate({
        path: 'comments',
        options: { sort: { createdAt: -1 } },
        populate: { path: 'author', select: '_id username avatar fullName' },
      });

    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── @route  DELETE /api/posts/:id ────────────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Delete image from Cloudinary
    if (post.image?.publicId) {
      await cloudinary.uploader.destroy(post.image.publicId);
    }

    // Delete all related comments
    await Comment.deleteMany({ post: post._id });

    await post.deleteOne();

    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    console.error('Delete Post Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── @route  POST /api/posts/:id/like ─────────────────────────────────────────
const toggleLike = async (req, res) => {
  try {
    const post     = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const userId   = req.user._id;
    const isLiked  = post.likes.includes(userId);

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.addToSet(userId);

      // Notify post author (not self-likes)
      if (post.author.toString() !== userId.toString()) {
        // Avoid duplicate notifications
        const exists = await Notification.findOne({
          recipient: post.author,
          sender:    userId,
          type:      'like',
          post:      post._id,
        });
        if (!exists) {
          await Notification.create({
            recipient: post.author,
            sender:    userId,
            type:      'like',
            post:      post._id,
            message:   `${req.user.username} liked your post.`,
          });
        }
      }
    }

    await post.save();

    res.json({
      success:  true,
      liked:    !isLiked,
      likeCount: post.likes.length,
    });
  } catch (err) {
    console.error('Like Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { createPost, getFeed, getExplorePosts, getPost, deletePost, toggleLike };
