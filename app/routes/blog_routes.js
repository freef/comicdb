const express = require('express')
const passport = require('passport')

// pull in Mongoose model
const Blog = require('../models/blog')
const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })
const router = express.Router()
const multer = require('multer')
const upload = multer({dest: 'uploads/', storage: multer.memoryStorage()})

// INDEX
router.get('/blog', (req, res, next) => {
  Blog.find({'pubdate': {'$lte': new Date()}}).sort({pubdate: 1})
    .then(blogs => {
      return blogs.map(blog => blog.toObject())
    })
    .then(blog => res.status(200).json({ blogs: blog }))
    .catch(next)
})

// SHOW
router.get('/blog/:id', (req, res, next) => {
  Blog.findById(req.params.id)
    .then(handle404)
    .then(blog => blog.pubdate <= new Date() ? blog : next)
    .then(blog => res.status(200).json({ blog: blog.toObject() }))
    .catch(next)
})

// CREATE
router.post('/blog', upload.single('image'), requireToken, (req, res, next) => {
  req.body.owner = req.user.id
  const newBlog = req.body
  Blog.create(newBlog)
    .then(blog => {
      res.status(201).json({ blog: blog.toObject() })
    })
    .catch(next)
})

// UPDATE
router.patch('/blog/:id', requireToken, upload.single('image'), removeBlanks, (req, res, next) => {
  delete req.body.example.owner
  Blog.findById(req.params.id)
    .then(handle404)
    .then(blog => blog.update(req.body.blog))
    .then(() => res.sendStatus(204))
    .catch(next)
})

// DESTROY
router.delete('/blog/:id', requireToken, (req, res, next) => {
  Blog.findById(req.params.id)
    .then(handle404)
    .then(blog => {
      requireOwnership(req, blog)
        .then(blog => blog.remove())
        .catch(next)
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

module.exports = router
