'use strict'

const browserify = require('browserify')
const babelPresetEs2015 = require('babel-preset-es2015')
const babelify = require('babelify')
const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')

class JSBuilder {
  getEntryFile () {
    return 'main'
  }

  build (src, dst, files, callback) {
    // Check if applicable.
    if (!files.some(f => f.endsWith('.js') || f.endsWith('.es'))) {
      return callback(false)
    }

    // Get source and target.
    let entryFile = this.getEntryFile()
    let source = path.join(src, 'js', `${entryFile}.js`)
    if (!fs.existsSync(source)) {
      return callback(false)
    }
    let targetDir = path.join(dst, 'js')
    fs.ensureDirSync(targetDir)
    let target = path.join(targetDir, `${entryFile}.js`)

    // Build JS.
    let timestamp = Date.now()
    console.log(`Building JS: ${chalk.gray(source)} ...`)
    browserify({ entries: source, extensions: ['.js', '.es'], debug: false })
      .transform(babelify, { presets: [babelPresetEs2015] })
      .bundle()
      .on('error', (err) => {
        console.error('Babel error:\n', err.toString())
        if (err.codeFrame) {
          console.error(err.codeFrame)
        }
        callback(false)
      })
      .pipe(fs.createWriteStream(target))
      .on('finish', () => {
        console.log(`Built JS in ${Date.now() - timestamp} ms: ${chalk.gray(target)}`)
        callback(true)
      })
  }
}

module.exports = JSBuilder
