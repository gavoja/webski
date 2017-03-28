;(function () {
  'use strict'

  var host = window.location.hostname
  var port = parseInt(window.location.port, 10) + 1
  var intervalId = null
  var ws = null

  var onopen = function (event) {
    console.log('Web socket connection opened.')
    window.clearInterval(intervalId)
  }

  var onmessage = function (event) {
    if (event.data === 'reload') {
      console.log('Reloading...')
      window.location.reload()
    }
  }

  var onclose = function (event) {
    console.log('Web socket connection closed.')
    ws = null
    tryToConnect()
  }

  var connect = function () {
    if (ws != null) {
      return
    }

    ws = new window.WebSocket('ws://' + host + ':' + port)
    ws.onopen = onopen
    ws.onmessage = onmessage
    ws.onclose = onclose
  }

  var tryToConnect = function () {
    intervalId = window.setInterval(connect, 1000)
  }

  tryToConnect()
})()
