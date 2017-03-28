'use strict'

const minimist = require('minimist')
const Webski = require('./src/webski')
const AssetBuilder = require('./src/builders/asset-builder')
const JSBuilder = require('./src/builders/js-builder')
const LessBuilder = require('./src/builders/less-builder')
const StylusBuilder = require('./src/builders/stylus-builder')
const fs = require('fs-extra')
const path = require('path')
const scp2 = require('scp2')
const exec = require('ssh-exec')

class Bootstrap {
  init () {
    if (fs.existsSync(path.join(process.cwd(), 'webski.json'))) {
      return console.log('Project already initialised.')
    }

    let initSrc = path.join(__dirname, 'assets', 'init')
    fs.readdirSync(initSrc).forEach((file) => {
      let src = path.join(initSrc, file)
      let dst = path.join(process.cwd(), file)
      if (!fs.existsSync(dst)) {
        fs.copySync(src, dst)
      }
    })

    console.log('Project initialised. Run webski to start the development.')
  }

  deploy () {
    // Check if config exists.
    let configPath = path.join(process.cwd(), 'webski.json')
    if (!fs.existsSync(configPath)) {
      return console.error('Missing webski.json.')
    }

    // Load config and validate.
    let cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    if (['host', 'user', 'pass', 'path'].some(s => typeof cfg[s] === 'undefined')) {
      return console.error('Incomplete webski.json.')
    }

    // Deploy.
    console.log('Deploying...')
    let target = `${cfg.user}:${cfg.pass}@${cfg.host}:${cfg.path}`
    let dist = path.join(process.cwd(), 'dist', '**')
    scp2.scp(dist, target, (err) => {
      if (err) {
        throw err
      }

      console.log('Deployed.')

      // Run commands if present.
      cfg.cmds && cfg.cmds.forEach((cmd) => {
        console.log(`Executing: ${cmd} ...`)
        exec(cmd, {host: cfg.host, user: cfg.user, password: cfg.pass}, (err, stdout, stderr) => {
          if (err) {
            throw err
          }

          stderr && console.error(stderr.trim())
          stdout && console.log(stdout.trim())
        })
      })
    })
  }

  main () {
    let args = minimist(process.argv.slice(2))

    // Init project.
    if (args._.length === 1) {
      if (args._[0] === 'init') {
        return this.init()
      }

      if (args._[0] === 'deploy') {
        return this.deploy()
      }
    }

    // Create instance.
    let webski = new Webski({
      hostname: args.h,
      port: args.p,
      src: args.s,
      dst: args.d
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
}

if (require.main === module) {
  let b = new Bootstrap()
  b.main()
}

module.exports = {
  Webski,
  AssetBuilder,
  JSBuilder,
  LessBuilder,
  StylusBuilder,
  Bootstrap
}
