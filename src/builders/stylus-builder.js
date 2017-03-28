'use strict'

const fs = require('fs-extra')
const path = require('path')
const stylus = require('stylus')
const printError = require('./../utils/print-error.js')
const chalk = require('chalk')

class StylusBuilder {
  getEntryFile () {
    return 'main'
  }

  build (src, dst, files, callback) {
    // Check if applicable.
    if (!files.some(f => f.endsWith('.styl'))) {
      return callback(false)
    }

    // Get source and target.
    let entryFile = this.getEntryFile()
    let sourceDir = path.join(src, 'css')
    let source = path.join(sourceDir, `${entryFile}.styl`)
    if (!fs.existsSync(source)) {
      return callback(false)
    }
    let targetDir = path.join(dst, 'css')
    fs.ensureDirSync(targetDir)
    let target = path.join(targetDir, `${entryFile}.css`)
    let targetMap = path.join(targetDir, `${entryFile}.css.map`)

    // Render Less.
    let timestamp = Date.now()
    console.log(`Building Stylus: ${chalk.gray(source)} ...`)
    let style = stylus(fs.readFileSync(source, 'utf8'))
      .set('filename', target)
      .set('paths', [sourceDir])
      .set('sourcemap', {comment: false})
    style.render((err, css) => {
      if (err) {
        printError(err)
        return callback(false)
      }

      fs.writeFileSync(target, css)
      if (style.sourcemap) {
        fs.writeFileSync(targetMap, style.sourcemap)
      }
      console.log(`Built Stylus in ${Date.now() - timestamp} ms: ${chalk.gray(target)}`)
      callback(true)
    })
  }
}

module.exports = StylusBuilder
