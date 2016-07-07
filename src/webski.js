'use strict'

const watch = require('simple-watcher')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const express = require('express')
const filelist = require('./helpers/filelist')
const mime = require('mime-types')
const WebSocketServer = require('ws').Server

const PUBLIC_PATH = path.join(__dirname, '..', 'public')
const PUBLIC_FRAGMENT = '__webski'
const INJECT = `
<script src="/${PUBLIC_FRAGMENT}/reload.js"></script>`

class Webski {
  constructor (args) {
    args = args || {}
    this.workingDir = args.workingDir
    this.hostname = args.hostname
    this.port = args.port
    this.builders = []
  }

  addBuilder (Builder) {
    this.builders.push(new Builder(this.workingDir))
    return this
  }

  run (onChange) {
    let wss = this.serve(this.workingDir)

    // Build all.
    this.builders.forEach((builders) => {
      builders.build(null, (result) => {
        result && this.reloadClient(wss)
      })
    })

    watch(this.workingDir, (filePath) => {
      // `Changed: ${filePath)}`
      console.log(`Changed: ${chalk.green(filePath)}`)

      // Apply builders.
      this.builders.forEach((builders) => {
        builders.build(filePath, (success) => {
          success && this.reloadClient(wss)
        })
      })
    })

    console.log(`Watching: ${chalk.yellow(this.workingDir)}`)
  }

  reloadClient (wss) {
    wss.clients.forEach((client) => {
      client.send('reload')
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
      let html = filelist(this.workingDir)
      data = data.replace('DATA', html)
      this.setContentType(res, '.html').status('404').send(data + INJECT)
    })
  }

  serve (workingDir, callback) {
    express()
      .use(`/${PUBLIC_FRAGMENT}`, express.static(PUBLIC_PATH))
      .use('/', (req, res) => {
        let localPath = path.join(workingDir,
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

    let wss = new WebSocketServer({
      host: this.hostname,
      port: this.port + 1
    })

    return wss
  }
}

module.exports.Webski = Webski
