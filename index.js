'use strict'

const minimist = require('minimist')
const Webski = require('./src/webski')
const AssetBuilder = require('./src/builders/asset-builder')
const JSBuilder = require('./src/builders/js-builder')
const LessBuilder = require('./src/builders/less-builder')
const StylusBuilder = require('./src/builders/stylus-builder')
const fs = require('fs-extra')
const path = require('path')

let init = () => {
  let src = path.join(__dirname, 'assets', 'init')
  let dst = process.cwd()

  ;['src', 'dist'].forEach(folder => {
    let completeDst = path.join(dst, folder)
    if (fs.existsSync(completeDst)) {
      fs.copySync(path.join(src, folder), completeDst)
    }
  })
}

let main = () => {
  let args = minimist(process.argv.slice(2))

  // Init project.
  if (args._.length === 1 && args._[0] === 'init') {
    init()
    return
  }

  // Create instance.
  let webski = new Webski({
    src: args.s,
    dst: args.d,
    hostname: args.h,
    port: args.p
  })

  // Add builders.
  webski
    .addBuilder(new AssetBuilder())
    .addBuilder(new JSBuilder())
    .addBuilder(new LessBuilder())
    .addBuilder(new StylusBuilder())

  // Run.
  webski.run()
}

if (require.main === module) {
  main()
}

module.exports = {
  Webski,
  AssetBuilder,
  JSBuilder,
  LessBuilder,
  StylusBuilder
}
