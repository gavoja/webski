'use strict'

const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')

const EXCLUDED_EXTENSIONS = [
  '.js', '.es', '.less', '.sass', '.styl', '.ect', '.pug'
]

class AssetBuilder {
  build (src, dst, files, callback) {
    let changed = false

    files.forEach(f => {
      let target = path.join(dst, f.substr(src.length))
      if (EXCLUDED_EXTENSIONS.some(ext => f.endsWith(ext))) {
        return
      }

      try {
        if (fs.statSync(f).isFile()) {
          fs.copySync(f, target)
          console.log(`Asset copied: ${chalk.gray(target)}`)
        }
      } catch (err) {
        console.log(`Asset removed: ${chalk.gray(target)}`)
        fs.removeSync(target)
      }

      changed = true
    })

    callback(changed)
  }
}

module.exports = AssetBuilder
