'use strict'

module.exports = cli

const path = require('path')
const semver = require('semver')
const log = require('@juan-cli/log')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync

const { LOWEST_NODE_VERSION, DEFAULT_CLI_HOME } = require('./const')
// require: .js|.json|.node
// .js -> module.exports/exports
// .json -> JSON.parse
// .node -> process.dlopen打开C++插件
// any -> .js 其他文件以js引擎来解析
const pkg = require('../package.json')

let args, config

function cli() {
  try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkInputArgs()
    checkEnv()
    log.verbose('debug', 'test debug log')
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
  const lowestVersion = LOWEST_NODE_VERSION
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

// 5. 检查入参
function checkInputArgs() {
  args = require('minimist')(process.argv.slice(2))

  checkArgs()
}

// 检查参数
function checkArgs(params) {
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
}

// 6. 检查环境变量
function checkEnv() {
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExists(dotenvPath)) {
    require('dotenv').config({
      path: dotenvPath
    })
  }
  config = createCliConfig()
  log.verbose('环境变量', process.env.CLI_HOME_PATH)
}

// 创建默认环境变量
function createCliConfig() {
  const cliConfig = {
    home: userHome
  }
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig['cliHome'] = path.join(userHome, DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome
  return cliConfig
}
