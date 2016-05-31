'use strict'

const fs = require('fs')
const path = require('path')
const stylus = require('stylus')
const Builder = require('./builder').Builder

class StylusBuilder extends Builder {
  constructor (workingDir) {
    super(workingDir)
    this.root = path.join(workingDir, 'stylus')
    this.source = path.join(this.root, 'main.styl')
    this.target = path.join(workingDir, 'main.css')
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

    stylus(fs.readFileSync(this.source, 'utf8'))
      .set('filename', this.target)
      .set('paths', [ this.root ])
      .render((err, css) => {
        if (err) {
          console.error('Stylus error:\n', err.toString())
          return callback(false)
        }

        fs.writeFileSync(this.target, css)
        console.log(`Stylus built: ${this.target}`)
        callback(true)
      })
  }
}

module.exports.StylusBuilder = StylusBuilder
