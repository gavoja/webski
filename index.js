'use strict'

const path = require('path')
const minimist = require('minimist')
const Webski = require('./src/webski').Webski
const Builder = require('./src/builders/builder').Builder
const HTMLBuilder = require('./src/builders/html-builder').HTMLBuilder
const JSBuilder = require('./src/builders/js-builder').JSBuilder
const LessBuilder = require('./src/builders/less-builder').LessBuilder
const StylusBuilder = require('./src/builders/stylus-builder').StylusBuilder

let main = () => {
  let args = minimist(process.argv.slice(2))
  let workingDir = path.resolve(args.w || process.cwd())

  let webski = new Webski({
    workingDir: workingDir,
    hostname: args.h || 'localhost',
    port: args.p || 8000
  })

  webski
    // .addBuilder(HTMLBuilder)
    // .addBuilder(JSBuilder)
    .addBuilder(LessBuilder)
    // .addBuilder(StylusBuilder)

  webski.run()
}

if (require.main === module) {
  main()
}

module.exports = {
  Webski: Webski,
  Builder: Builder,
  HTMLBuilder: HTMLBuilder,
  JSBuilder: JSBuilder,
  LessBuilder: LessBuilder,
  StylusBuilder: StylusBuilder
}
