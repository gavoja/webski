'use strict'

const fs = require('fs')
const path = require('path')
const sorter = require('path-sort').standalone(path.delimiter)

let getFileList = (dirPath) => {
  dirPath = path.resolve(dirPath)
  let items = getItems(dirPath, 0).sort(sorter)
  return toHtml(dirPath, items)
}

let getItems = (parent) => {
  let items = []
  try {
    // Iterate over list of children.
    fs.readdirSync(parent).forEach(child => {
      let fullPath = path.join(parent, child)

      if (fs.statSync(fullPath).isDirectory()) {
        // Add the children.
        items = items.concat(getItems(fullPath))
        // Add all HTML files.
      } else if (path.extname(child) === '.html') {
        items.push(fullPath)
      }
    })
  } catch (err) {
    console.error(err)
  }

  return items
}

let toHtml = (dirPath, items) => {
  let html = ''
  items.forEach(item => {
    let short = item.substr(dirPath.length + 1)
    let depth = (short.match(/\\|\//g) || []).length
    let href = `/${short.replace(/\\/g, '/')}`
    html += `<a href="${href}" class="depth--${depth}">${short}</a><br/>`
  })

  return html
}

module.exports = (dirPath) => {
  return getFileList(dirPath)
}
