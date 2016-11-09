'use strict'

const fs = require('fs')
const path = require('path')
const less = require('less')
const autoprefixer = require('autoprefixer')
const postcss = require('postcss')
const leftPad = require('left-pad')
const Builder = require('./builder').Builder

class LessBuilder extends Builder {
  constructor (workingDir) {
    super(workingDir)
    this.root = path.join(workingDir, 'less')
    this.source = path.join(this.root, 'main.less')
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

    // Render LESS.
    less.render(fs.readFileSync(this.source, 'utf8'), {
      filename: this.source
    }).then((output) => {
      postcss([ autoprefixer({ browsers: ['> 1%', 'last 3 versions', 'IE >= 9'] }) ]).process(output.css).then((result) => {
        result.warnings().forEach((warn) => {
          console.warn(warn.toString())
        })

        fs.writeFileSync(this.target, result.css)
        console.log(`Less built: ${this.target}`)
        callback(true)
      })
    }, (err) => {
      this.printError(err)
      callback(false)
    })
  }

  printError (err) {
    console.error(`Less error in ${err.filename} (${err.line}:${err.column}): ${err.message}`)
    err.extract.forEach((chunk, i) => {
      if (chunk) {
        let line = leftPad(err.line + i, 8)
        console.error(`${line} | ${chunk}`)
      }
    })
  }
}

module.exports.LessBuilder = LessBuilder
