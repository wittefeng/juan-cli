'use strict'

const path = require('path')
const cp = require('child_process')
const Package = require('@juan-cli/package')
const log = require('@juan-cli/log')
const { stringify } = require('querystring')

const SETTING = {
  init: '@juan-cli/init'
}

const CACHE_DIR = 'dependencies'

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH
  const homePath = process.env.CLI_HOME_PATH
  let storePath = '',
    pkg
  log.verbose('targetPath', targetPath)
  log.verbose('homePath', homePath)

  const cmdObj = arguments[arguments.length - 1]
  const argsObj = arguments[arguments.length - 2]
  const cmdName = cmdObj.name()
  const packageName = SETTING[cmdName]
  const packageVersion = 'latest'

  if (!targetPath) {
    // 生成缓存路径
    targetPath = path.resolve(homePath, CACHE_DIR)
    storePath = path.resolve(targetPath, 'node_modules')
    log.verbose('targetPath', targetPath)
    log.verbose('storePath', storePath)
    pkg = new Package({
      targetPath,
      storePath,
      packageName,
      packageVersion
    })
    if (await pkg.exists()) {
      // 更新 pkg
      await pkg.update()
    } else {
      // 获取缓存目录 安装 pkg
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion
    })
  }
  const rootFile = pkg.getRootFilePath()
  if (rootFile) {
    try {
      // require(rootFile).call(null, Array.from(arguments))
      // 在当前进程中调用
      // 在node子进程中调用
      // console.log(Array.from(arguments))
      const args = Array.from(arguments)
      const o = Object.create(null)
      const cmd = args[args.length - 1]
      Object.keys(cmd).forEach((key) => {
        if (
          cmd.hasOwnProperty(key) &&
          !key.startsWith('_') &&
          key !== 'parent'
        ) {
          o[key] = cmd[key]
        }
      })
      args[args.length - 1] = o
      const child = spawn(
        'node',
        ['-e', `require('${rootFile}').call(null, ${JSON.stringify(args)})`],
        {
          cwd: process.cwd(),
          stdio: 'inherit'
        }
      )
      child.on('error', (e) => {
        log.error(e.message)
        process.exit(1)
      })
      child.on('exit', (e) => {
        log.verbose('命令执行成功', e)
        process.exit(e)
      })
    } catch (error) {
      log.error(error)
    }
  }
}

function spawn(command, args, options) {
  const win32 = process.platform === 'win32'
  const cmd = win32 ? 'cmd' : command
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args
  return cp.spawn(cmd, cmdArgs, options || {})
}

module.exports = exec
