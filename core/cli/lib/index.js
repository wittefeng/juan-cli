'use strict'

module.exports = cli

const path = require('path')
const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const commander = require('commander')
const log = require('@juan-cli/log')

const { LOWEST_NODE_VERSION, DEFAULT_CLI_HOME } = require('./const')
// require: .js|.json|.node
// .js -> module.exports/exports
// .json -> JSON.parse
// .node -> process.dlopen打开C++插件
// any -> .js 其他文件以js引擎来解析
const pkg = require('../package.json')

let args

const program = new commander.Command()

async function cli() {
  try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    // checkInputArgs()
    checkEnv()
    await checkGlobalUpdate()
    registerCommand()
  } catch (error) {
    log.error(error.message)
  }
}

// 1. 检查版本号
function checkPkgVersion() {
  console.log()
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
function checkArgs() {
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
  createCliConfig()
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

// 7. 检查版本更新
async function checkGlobalUpdate() {
  log.verbose('检查 juan-li 最新版本')
  // 1. 获取当前版本号和模块名
  const currentVersion = pkg.version
  const npmName = pkg.name
  // 2. 调用npm API，获取所有版本号
  const { getNpmSemverVersion } = require('@juan-cli/get-npm-info')
  const lastVersions = await getNpmSemverVersion(currentVersion, npmName)
  if (lastVersions && semver.gt(lastVersions, currentVersion)) {
    log.warn(
      `
  ${colors.yellow(
    '╭──────────────────────────────────────────────────────────────────────────'
  )}
  ${colors.yellow('│')} 
  ${colors.yellow('│')} New ${colors.red(
        'major'
      )} version of ${npmName} available! ${colors.red(
        currentVersion
      )} → ${colors.green(lastVersions)}     
  ${colors.yellow('│')} ${colors.yellow('Changelog')}: ${colors.blue(
        'https://github.com/wittefeng/juan-cli/tree/v' + lastVersions
      )}  
  ${colors.yellow('│')} Run ${colors.green(
        'npm install -g ' + npmName
      )} to update! 
  ${colors.yellow('│')} 
  ${colors.yellow(
    '╰──────────────────────────────────────────────────────────────────────────'
  )}`
    )
  }
  // 3. 提取所有版本号，比对哪些版本号是大于当前版本号
  // 4. 获取最新的版本号，提示用户更新到该版本号
}

// 注册 command
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '调试模式')

  // 开启 debug 模式
  program.on('option:debug', function () {
    process.env.LOG_LEVEL = 'verbose'
    log.level = process.env.LOG_LEVEL
  })

  // 监听未知命令
  program.on('command:*', function (obj) {
    const availableCommands = program.commands.map((cmd) => cmd.name())
    console.log(colors.red('未知的命令：' + obj[0]))
    if (availableCommands.length > 0) {
      console.log(colors.red('可用命令：' + avaliableCommands.join(',')))
    }
  })

  program.parse(process.argv)
  if (program.args && program.args.length < 1) {
    program.outputHelp()
    console.log()
  }
}
