'use strict'

module.exports = cli

const semver = require('semver')
const log = require('@juan-cli/log')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync

const constant = require('./const')
// require: .js|.json|.node
// .js -> module.exports/exports
// .json -> JSON.parse
// .node -> process.dlopen打开C++插件
// any -> .js 其他文件以js引擎来解析
const pkg = require('../package.json')

function cli() {
  try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
  } catch (error) {
    log.error(error.message)
  }
}

// 1. 检查版本号
function checkPkgVersion() {
  log.info('cli version', pkg.version)
}

// 2. 检查node版本号
function checkNodeVersion() {
  // 1. 获取当前Node版本号
  const currentVersion = process.version
  // 2. 比对最低版本号
  const lowestVersion = constant.LOWEST_NODE_VERSION
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(
      colors.red(`juan-cli 需要安装 v${lowestVersion} 以上版本的 Node.js`)
    )
  }
}

// 3. 检查root
function checkRoot() {
  const rootCheck = require('root-check')
  rootCheck()
  console.log(process.geteuid())
}

// 4. 检查用户目录
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前登录用户主目录不存在！'))
  }
}
