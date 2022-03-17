'use strict'

const ora = require('ora')

function spinnerStart(msg = '正在加载中...') {
  const spinner = ora(msg).start()
  return spinner
}

module.exports = spinnerStart
