'use strict'

const ora = require('ora')
const cliSpinners = require('cli-spinners')

function spinnerStart(msg = '正在加载中...', name = 'aesthetic') {
  console.log('spinners name', name)
  const spinner = ora({
    text: msg,
    spinner: cliSpinners[name]
  }).start()
  return spinner
}

module.exports = spinnerStart
