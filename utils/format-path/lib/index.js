'use strict'

const path = require('path')

module.exports = function formatPath(p) {
  if (p && typeof p === 'string') {
    // 处理分隔符
    // mac sep = /
    // windows sep = \
    const sep = path.sep
    if (sep === '/\\') {
      return p.replace(/\\/g, '/')
    }
  }
  return p
}
