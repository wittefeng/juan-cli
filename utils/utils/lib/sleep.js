'use strict'

// 延时

module.exports = function (timeout = 1000) {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}
