'use strict'

const watch = require('simple-watcher')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const express = require('express')
const WebSocketServer = require('ws').Server

const CLIENT_DIR = '__webski'
const INJECT = `
<script src="/${CLIENT_DIR}/reload.js"></script>`
const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.txt': 'text/plain',
  '.js': 'application/javascript'
}

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

  handleError (req, res, err) {
    this.setContentType(res, '.txt')
    res.status(404).send(`Not found: ${err.localPath}`)
  }

  setContentType (res, ext) {
    let type = TYPES[ext]
    type && res.setHeader('content-type', type)
  }

  serve (workingDir, callback) {
    console.log(path.join(__dirname, '..', 'client'))
    express()
      .use(`/__webski`, express.static(path.join(__dirname, '..', 'client')))
      .use('/', (req, res) => {
        let localPath = path.join(workingDir,
          req.path.endsWith('/') ? req.path + 'index.html' : req.path)
        let ext = path.extname(localPath)

        // Set content type header.
        this.setContentType(res, ext)

        // Serve the file.
        fs.readFile(localPath, 'utf8', (err, data) => {
          if (err) {
            err.localPath = localPath
            return this.handleError(req, res, err)
          }

          ext === '.html' ? res.send(data + INJECT) : res.send(data)
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
