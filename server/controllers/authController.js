const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ─── Generate JWT Token ────────────────────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// ─── @route  POST /api/auth/register ──────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username, email, and password.' });
    }

    // Check existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(409).json({ success: false, message: `${field} already taken.` });
    }

    const user = await User.create({ username, email, password, fullName });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        _id:      user._id,
        username: user.username,
        email:    user.email,
        fullName: user.fullName,
        avatar:   user.avatar,
        bio:      user.bio,
        followers: user.followers,
        following: user.following,
      },
    });
  } catch (err) {
    console.error('Register Error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ─── @route  POST /api/auth/login ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, message: 'Please provide credentials.' });
    }

    // Find by email OR username
    const user = await User.findOne({
      $or: [
        { email:    emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() },
      ],
    }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        _id:      user._id,
        username: user.username,
        email:    user.email,
        fullName: user.fullName,
        avatar:   user.avatar,
        bio:      user.bio,
        followers: user.followers,
        following: user.following,
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ─── @route  GET /api/auth/me ──────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', '_id username avatar fullName')
      .populate('following', '_id username avatar fullName');

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getMe };
