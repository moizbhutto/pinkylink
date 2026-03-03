const User         = require('../models/User');
const Post         = require('../models/Post');
const Notification = require('../models/Notification');
const { cloudinary, uploadAvatar } = require('../config/cloudinary');

// ─── @route  GET /api/users/:username ─────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', '_id username avatar fullName')
      .populate('following', '_id username avatar fullName');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .select('image likes comments createdAt');

    res.json({ success: true, user, posts, postCount: posts.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── @route  PUT /api/users/edit ──────────────────────────────────────────────
const editProfile = async (req, res) => {
  try {
    const { fullName, bio, website } = req.body;
    const updates = {};

    if (fullName !== undefined) updates.fullName = fullName;
    if (bio      !== undefined) updates.bio      = bio;
    if (website  !== undefined) updates.website  = website;

    // Avatar upload (via multer/cloudinary middleware)
    if (req.file) {
      // Delete old avatar from cloudinary if exists
      const user = await User.findById(req.user._id);
      if (user.avatar?.publicId) {
        await cloudinary.uploader.destroy(user.avatar.publicId);
      }
      updates.avatar = {
        url:      req.file.path,
        publicId: req.file.filename,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, updates, { new: true, runValidators: true }
    ).populate('followers', '_id username avatar fullName')
     .populate('following', '_id username avatar fullName');

    res.json({ success: true, message: 'Profile updated!', user: updatedUser });
  } catch (err) {
    console.error('Edit Profile Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── @route  POST /api/users/:id/follow ───────────────────────────────────────
const toggleFollow = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId     = req.user._id;

    if (targetId === myId.toString()) {
      return res.status(400).json({ success: false, message: "You can't follow yourself." });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

    const isFollowing = targetUser.followers.includes(myId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(targetId, { $pull: { followers: myId } });
      await User.findByIdAndUpdate(myId, { $pull: { following: targetId } });
      res.json({ success: true, action: 'unfollowed', message: `Unfollowed @${targetUser.username}` });
    } else {
      // Follow
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } });
      await User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } });

      // Create notification
      await Notification.create({
        recipient: targetId,
        sender:    myId,
        type:      'follow',
        message:   `${req.user.username} started following you.`,
      });

      res.json({ success: true, action: 'followed', message: `Now following @${targetUser.username}` });
    }
  } catch (err) {
    console.error('Follow Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── @route  GET /api/users/search?q=query ────────────────────────────────────
const searchUsers = async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query) return res.json({ success: true, users: [] });

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
      ],
      _id: { $ne: req.user._id }, // exclude self
    })
    .limit(20)
    .select('_id username fullName avatar followers');

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── @route  GET /api/users/suggestions ──────────────────────────────────────
const getSuggestions = async (req, res) => {
  try {
    // Suggest users not already followed, excluding self
    const users = await User.find({
      _id:      { $ne: req.user._id },
      _id:      { $nin: [...req.user.following, req.user._id] },
    })
    .limit(8)
    .select('_id username fullName avatar followers');

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getProfile, editProfile, toggleFollow, searchUsers, getSuggestions };
