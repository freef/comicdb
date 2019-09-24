const cloudinary = require('cloudinary').v2
require('dotenv').config()
cloudinary.config({cloud_name: process.env.CLOUD_NAME, api_key: process.env.API_KEY, api_secret: process.env.API_SECRET})

const cloudinaryUpload = function (dataURL) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream((err, result) => (err ? reject(err) : resolve(result))).end(dataURL.buffer)
  })
}

module.exports = cloudinaryUpload
