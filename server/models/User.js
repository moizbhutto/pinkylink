const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String, required: true, unique: true, trim: true, lowercase: true,
    minlength: 3, maxlength: 30,
    match: [/^[a-z0-9_.]+$/, 'Username can only contain letters, numbers, underscores, and dots'],
  },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String, required: true, minlength: 6, select: false,
  },
  fullName: {
    type: String, trim: true, maxlength: 50,
  },
  bio: {
    type: String, maxlength: 150, default: '',
  },
  avatar: {
    url:      { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  website: {
    type: String, maxlength: 100, default: '',
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isVerified: { type: Boolean, default: false },
  isPrivate:  { type: Boolean, default: false },
}, { timestamps: true });

// ─── Hash password before saving ──────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Compare password method ───────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Virtual: post count ───────────────────────────────────────────────────────
userSchema.virtual('followersCount').get(function () {
  return this.followers.length;
});
userSchema.virtual('followingCount').get(function () {
  return this.following.length;
});

module.exports = mongoose.model('User', userSchema);
