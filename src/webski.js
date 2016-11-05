'use strict'

const watch = require('simple-watcher')
const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const express = require('express')
const filelist = require('./utils/filelist.js')
const walk = require('./utils/walk.js')
const mime = require('mime-types')
const WebSocket = require('ws')

const DIST_DIR = 'dist'
const PUBLIC_PATH = path.join(__dirname, '..', 'www')
const PUBLIC_FRAGMENT = '__webski'
const INJECT = `
<script src="/${PUBLIC_FRAGMENT}/reload.js"></script>`

class Webski {
  constructor (args) {
    args = args || {}
    this.src = path.resolve(args.src || process.cwd())
    this.dst = path.resolve(args.dst || path.join(process.cwd(), DIST_DIR))
    this.app = args.app || express()
    this.hostname = args.hostname || 'localhost'
    this.port = args.port || 8000
    this.builders = []

    console.log(`Building from ${chalk.gray(this.src)} to ${chalk.gray(this.dst)}.`)
  }

  addBuilder (builder) {
    this.builders.push(builder)
    return this
  }

  clean () {
    console.log(`Cleaning: ${chalk.gray(this.dst)}`)
    fs.emptyDirSync(this.dst)
  }

  build (src, dst, files, callback) {
    files = files || walk(src)
    let changed = false
    let counter = 0
    this.builders.forEach((builder, i) => {
      builder.build(src, dst, files, (success) => {
        counter += 1
        changed = changed || success

        // Reload at the end if anything changed.
        if (counter === this.builders.length) {
          callback && callback(changed)
        }
      })
    })
  }

  run (callback) {
    let wss = this.serve(this.dst)
    this.clean(this.dst)
    this.build(this.src, this.dst, null, callback)
    watch(this.src, f => {
      if (f.startsWith(this.dst)) {
        return
      }

      console.log(`Changed: ${chalk.gray(f)}`)
      this.build(this.src, this.dst, [f], (changed) => {
        if (changed) {
          this.reloadClient(wss)
        }

        callback && callback(changed)
      })
    })

    console.log(`Watching: ${chalk.gray(this.src)}`)
  }

  reloadClient () {
    if (!this.wss) {
      return
    }

    console.log(`Refreshing browser.`)
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload')
      }
    })
  }

  setContentType (res, ext) {
    let type = mime.lookup(ext) || 'text/plain'
    res.setHeader('content-type', type)
    return res
  }

  handleError (req, res, err) {
    // In case of 404 show the HTML file list.
    fs.readFile(path.join(PUBLIC_PATH, 'index.html'), 'utf-8', (err, data) => {
      if (err) {
        this.setContentType(res, '.txt').status('500').send(`Error: ${err.toString()}`)
      }
      let html = filelist(this.dst)
      data = data.replace('DATA', html)
      this.setContentType(res, '.html').status('404').send(data + INJECT)
    })
  }

  serve (callback) {
    this.app
      .use(`/${PUBLIC_FRAGMENT}`, express.static(PUBLIC_PATH))
      .use('/', (req, res) => {
        let localPath = path.join(this.dst,
          req.path.endsWith('/') ? req.path + 'index.html' : req.path)
        let ext = path.extname(localPath)

        // Serve asset.
        if (ext !== '.html') {
          return res.sendFile(localPath)
        }

        // Serve the HTML file.
        fs.readFile(localPath, 'utf8', (err, data) => {
          if (err) {
            err.localPath = localPath
            return this.handleError(req, res, err)
          }

          this.setContentType(res, ext).send(data + INJECT)
        })
      })
      .listen(this.port, this.hostname, () => {
        let host = `${this.hostname}:${this.port}`
        console.log(`Listening: ${chalk.blue(host)}`)
      })

    this.wss = new WebSocket.Server({
      host: this.hostname,
      port: this.port + 1
    })
  }
}

module.exports = Webski
