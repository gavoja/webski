'use strict'

const path = require('path')
const fs = require('fs-extra')

/** Recursively walks over directory. */
let walk = (localPath) => {
  localPath = path.resolve(localPath)

  let results = []

  // Add current item.
  results.push(localPath)

  // No need for recursion if not a directory.
  if (!fs.statSync(localPath).isDirectory()) {
    return results
  }

  // Iterate over list of children.
  let children = fs.readdirSync(localPath)

  for (let i = 0; i < children.length; ++i) {
    let child = path.resolve(localPath, children[i])
    results = results.concat(walk(child))
  }

  return results
}

module.exports = walk
