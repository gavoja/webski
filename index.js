'use strict'

const minimist = require('minimist')
const Webski = require('./src/webski')
const AssetBuilder = require('./src/builders/asset-builder')
const JSBuilder = require('./src/builders/js-builder')
const LessBuilder = require('./src/builders/less-builder')
const StylusBuilder = require('./src/builders/stylus-builder')

let main = () => {
  let args = minimist(process.argv.slice(2))
  let webski = new Webski({
    src: args.s,
    dst: args.d,
    hostname: args.h,
    port: args.p
  })

  webski
    .addBuilder(new AssetBuilder())
    .addBuilder(new JSBuilder())
    .addBuilder(new LessBuilder())
    .addBuilder(new StylusBuilder())

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
