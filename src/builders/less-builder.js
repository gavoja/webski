'use strict'

const fs = require('fs-extra')
const path = require('path')
const less = require('less')
const printError = require('./../utils/print-error.js')
const chalk = require('chalk')
const autoprefixer = require('autoprefixer')
const postcss = require('postcss')

class LessBuilder {
  getEntryFile () {
    return 'main'
  }

  build (src, dst, files, callback) {
    // Check if applicable.
    if (!files.some(f => f.endsWith('.less'))) {
      return callback(false)
    }

    // Get source and target.
    let entryFile = this.getEntryFile()
    let source = path.join(src, 'css', `${entryFile}.less`)
    if (!fs.existsSync(source)) {
      return callback(false)
    }
    let targetDir = path.join(dst, 'css')
    fs.ensureDirSync(targetDir)
    let target = path.join(targetDir, `${entryFile}.css`)
    let targetMap = path.join(targetDir, `${entryFile}.css.map`)

    // Render Less.
    let timestamp = Date.now()
    console.log(`Building Less: ${chalk.gray(source)} ...`)
    less.render(fs.readFileSync(source, 'utf8'), {
      filename: source,
      sourceMap: {sourceMapBasepath: path.dirname(require.main.filename), sourceMapFileInline: true, outputSourceFiles: true}
    }).then((output) => {
      postcss([ autoprefixer({ browsers: ['> 1%', 'last 3 versions', 'IE >= 9'] }) ]).process(output.css, {map: {annotation: `${entryFile}.css.map`}}).then((result) => {
        result.warnings().forEach((warn) => {
          console.warn(warn.toString())
        })

        fs.writeFileSync(target, result.css)
        if (result.map) {
          fs.writeFileSync(targetMap, result.map)
        }

        console.log(`Built Less in ${Date.now() - timestamp} ms: ${chalk.gray(target)}`)
        callback(true)
      })
    }, (err) => {
      printError(err)
      callback(false)
    })
  }
}

module.exports = LessBuilder
