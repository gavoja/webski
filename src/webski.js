'use strict'

const watch = require('simple-watcher')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const express = require('express')
const filelist = require('./helpers/filelist')
const mime = require('mime-types')
const WebSocket = require('ws')

const PUBLIC_PATH = path.join(__dirname, '..', 'public')
const PUBLIC_FRAGMENT = '__webski'
const INJECT = `
<script src="/${PUBLIC_FRAGMENT}/reload.js"></script>`

class Webski {
  constructor (args) {
    args = args || {}
    this.workingDir = args.workingDir
    this.serveDir = args.serveDir || args.workingDir
    this.hostname = args.hostname
    this.port = args.port
    this.builders = []
  }

  addBuilder (Builder) {
    this.builders.push(new Builder(this.workingDir))
    return this
  }

  build (filePath, wss, callback) {
    let changed = false
    this.builders.forEach((builder, i) => {
      builder.build(filePath, (success) => {
        changed = changed || success

        // Reload at the end if anything changed.
        if (i === this.builders.length - 1 && changed) {
          this.reloadClient(wss)
          callback && callback()
        }
      })
    })
  }

  run (once, callback) {
    let wss = this.serve(this.serveDir)

    this.build(null, wss, callback)

    if (once) {
      return
    }

    watch(this.workingDir, (filePath) => {
      console.log(`Changed: ${chalk.green(filePath)}`)
      this.build(filePath, wss, callback)
    })

    console.log(`Watching: ${chalk.yellow(this.workingDir)}`)
  }

  reloadClient (wss) {
    wss.clients.forEach((client) => {
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
      let html = filelist(this.serveDir)
      data = data.replace('DATA', html)
      this.setContentType(res, '.html').status('404').send(data + INJECT)
    })
  }

  serve (callback) {
    express()
      .use(`/${PUBLIC_FRAGMENT}`, express.static(PUBLIC_PATH))
      .use('/', (req, res) => {
        let localPath = path.join(this.serveDir,
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
        console.log(`Listening: ${chalk.yellow(host)}`)
      })

    let wss = new WebSocket.Server({
      host: this.hostname,
      port: this.port + 1
    })

    return wss
  }
}

module.exports.Webski = Webski
