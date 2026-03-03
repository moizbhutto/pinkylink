const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true,
  },
  image: {
    url:      { type: String, required: true },
    publicId: { type: String, required: true },
  },
  caption: {
    type: String, maxlength: 2200, default: '',
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  tags:    [{ type: String }],
  location: { type: String, default: '' },
}, { timestamps: true });

// ─── Text index for search ─────────────────────────────────────────────────────
postSchema.index({ caption: 'text', tags: 'text' });

// ─── Virtual like count ────────────────────────────────────────────────────────
postSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

module.exports = mongoose.model('Post', postSchema);
