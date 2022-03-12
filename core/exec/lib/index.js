'use strict'

const Package = require('@juan-cli/package')
const log = require('@juan-cli/log')

const SETTING = {
  init: '@juan-cli/init'
}

function exec() {
  let targetPath = process.env.CLI_TARGET_PATH
  const homePath = process.env.CLI_HOME_PATH
  log.verbose('targetPath', targetPath)
  log.verbose('homePath', homePath)

  const cmdObj = arguments[arguments.length - 1]
  const argsObj = arguments[arguments.length - 2]
  const cmdName = cmdObj.name()
  const packageName = SETTING[cmdName]
  const packageVersion = 'latest'

  if (!targetPath) {
    // 生成缓存路径
    targetPath = ''
  }

  const pkg = new Package({
    targetPath,
    packageName,
    packageVersion
  })
  console.log('pkg', pkg.getRootFilePath())
}
module.exports = exec
