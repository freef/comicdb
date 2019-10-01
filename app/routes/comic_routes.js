const express = require('express')
const passport = require('passport')

// pull in Mongoose model
const Comic = require('../models/comic')
const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })
const router = express.Router()
const multer = require('multer')
const upload = multer({dest: 'uploads/', storage: multer.memoryStorage()})
const cloudinaryUpload = require('../../lib/cloudinaryUpload.js')
const cloudinaryDelete = require('../../lib/cloudinaryDelete.js')
const RSS = require('rss')
const feed = new RSS({ title: 'Flopsy & Bupp', feed_url: 'test.com/feed', description: 'A web comic', site_url: 'test.com', copyright: 'Matt Freeland 2019' })

// INDEX
router.get('/comics', (req, res, next) => {
  Comic.find({'pubdate': {'$lte': new Date()}}).sort({pubdate: 1})
    .then(comics => {
      return comics.map(comic => comic.toObject())
    })
    .then(comic => res.status(200).json({ comics: comic }))
    .catch(next)
})

// SHOW
router.get('/comics/:id', (req, res, next) => {
  Comic.findById(req.params.id)
    .then(handle404)
    .then(comic => comic.pubdate <= new Date() ? comic : next)
    .then(comic => res.status(200).json({ comic: comic.toObject() }))
    .catch(next)
})

// CREATE
router.post('/comics', upload.single('image'), requireToken, (req, res, next) => {
  req.body.owner = req.user.id
  const newComic = req.body
  cloudinaryUpload(req.file)
    .then(cloudinaryResponse => {
      console.log(cloudinaryResponse)
      newComic.img = cloudinaryResponse.url
      newComic.cloudId = cloudinaryResponse.public_id
      return Comic.create(newComic)
    })
    .then(comic => {
      res.status(201).json({ comic: comic.toObject() })
    })
    .catch(next)
})

// UPDATE
router.patch('/comics/:id', requireToken, upload.single('image'), removeBlanks, (req, res, next) => {
  delete req.body.example.owner
  Comic.findById(req.params.id)
    .then(handle404)
    .then(comic => {
      requireOwnership(req, comic)
      cloudinaryDelete(comic.cloudId)
      cloudinaryUpload(req.body.data.img)
        .then(cloudinaryResponse => {
          req.body.comic.img = cloudinaryResponse.URL
          req.body.comic.cloudId = cloudinaryResponse.public_id
          return comic.update(req.body.comic)
        })
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

// DESTROY
router.delete('/comics/:id', requireToken, (req, res, next) => {
  Comic.findById(req.params.id)
    .then(handle404)
    .then(comic => {
      requireOwnership(req, comic)
      cloudinaryDelete(comic.cloudId)
        .then(comic => comic.remove())
        .catch(next)
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

// RSS
router.get('/rss', (req, res, next) => {
  Comic.find({'pubdate': {'$lte': new Date()}})
    .then(comics => {
      return comics.map(comic => comic.toObject())
    })
    .then((comics) => {
      comics.forEach(c => {
        feed.item({ title: c.title, url: 'test.com/comics/' + c._id, author: 'Matt Freeland', date: c.pubdate })
      })
      return feed
    })
    .then(feed => {
      res.type('application/xml')
      res.send((feed.xml({indent: true})))
    })
    .catch(next)
})

module.exports = router
