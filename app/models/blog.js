const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  pubdate: {
    type: Date,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Blog', blogSchema)
