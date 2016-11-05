'use strict'

const leftPad = require('left-pad')

let printError = (err) => {
  console.error(`Less error in ${err.filename} (${err.line}:${err.column}): ${err.message}`)
  err.extract.forEach((chunk, i) => {
    if (chunk) {
      let line = leftPad(err.line + i, 8)
      console.error(`${line} | ${chunk}`)
    }
  })
}

module.exports = printError
