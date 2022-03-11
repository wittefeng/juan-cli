'use strict'

// 判断是否是obj

module.exports = function (o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}
