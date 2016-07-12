'use strict'

const browserify = require('browserify')
const babelPresetEs2015 = require('babel-preset-es2015')
const path = require('path')
const fs = require('fs')
const Builder = require('./builder').Builder

class JSBuilder extends Builder {
  constructor (workingDir) {
    super(workingDir)
    this.root = path.join(workingDir, 'js')
    this.source = path.join(this.root, 'main.js')
    this.target = path.join(workingDir, 'main.js')
  }

  getWriteStream () {
    return fs.createWriteStream(this.target)
  }

  build (filePath, callback) {
    // Check if applicable.
    if (filePath && !filePath.startsWith(this.root)) {
      return callback(false)
    }

    // Skip if no source.
    if (!fs.existsSync(this.source)) {
      return callback(false)
    }

    // Build.
    browserify({ entries: this.source, extensions: ['.js', '.es'], debug: false })
      .transform('babelify', { presets: [babelPresetEs2015] })
      .bundle()
      .on('error', (err) => {
        console.error('Babel error:\n', err.toString())
        if (err.codeFrame) {
          console.error(err.codeFrame)
        }
        callback(false)
      })
      .pipe(this.getWriteStream())
      .on('finish', () => {
        console.log(`JS built: ${this.target}`)
        callback(true)
      })
  }
}

module.exports.JSBuilder = JSBuilder
