'use strict'

const semver = require('semver')
const colors = require('colors/safe')
const log = require('@juan-cli/log')

const LOWEST_NODE_VERSION = '121.0.0'
class Command {
  constructor(argv) {
    // console.log('Command constructor', argv)
    this._argv = argv
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve()
      chain = chain.then(() => {
        this.checkNodeVersion()
      })
      chain.catch((err) => {
        log.error(err.message)
      })
    })
  }

  init() {
    throw new Error('init 必须实现')
  }
  exec() {
    throw new Error('exec 必须实现')
  }

  //  检查node版本号
  checkNodeVersion() {
    // 1. 获取当前Node版本号
    const currentVersion = process.version
    // 2. 比对最低版本号
    const lowestVersion = LOWEST_NODE_VERSION
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(
        colors.red(`juan-cli 需要安装 v${lowestVersion} 以上版本的 Node.js`)
      )
    }
  }
}
module.exports = Command
