'use strict'

const path = require('path')
const Package = require('@juan-cli/package')
const log = require('@juan-cli/log')

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
    storePath = path.resolve(homePath, 'node_modules')
    log.verbose('targetPath', targetPath)
    log.verbose('storePath', storePath)
    pkg = new Package({
      targetPath,
      storePath,
      packageName,
      packageVersion
    })
    if (pkg.exists()) {
      // 更新 pkg
    } else {
      // 获取缓存目录 安装 pkg
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      storePath,
      packageName,
      packageVersion
    })
  }

  const rootFile = pkg.getRootFilePath()
  if (rootFile) {
    require(rootFile).apply(null, arguments)
  }
}
module.exports = exec
