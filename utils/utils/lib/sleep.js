'use strict'

// time delay

module.exports = function (timeout = 1000) {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}
