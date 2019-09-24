const cloudinary = require('cloudinary').v2
require('dotenv').config()
const cloudinaryDelete = function (publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.delete(publicId, (err, result) => (err ? reject(err) : resolve(result)))
  })
}

module.exports = cloudinaryDelete
