'use strict'

const Builder = require('./builder').Builder

class HTMLBuilder extends Builder {
  build (filePath, callback) {
    // Check if applicable.
    if (filePath && !filePath.match(/\.html$/)) {
      return callback(false)
    }

    console.log(`HTML changed.`)
    callback(true)
  }
}

module.exports.HTMLBuilder = HTMLBuilder
